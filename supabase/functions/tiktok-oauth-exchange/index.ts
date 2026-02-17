import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    console.log(`👤 User authenticated: ${userId}`);

    const { auth_code, redirect_uri } = await req.json();
    if (!auth_code) {
      return new Response(JSON.stringify({ error: "Missing auth_code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("TIKTOK_APP_ID")!;
    const appSecret = Deno.env.get("TIKTOK_APP_SECRET")!;

    console.log("🔄 Exchanging auth_code for access_token...");

    // Exchange auth_code for access_token
    const tokenResponse = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          secret: appSecret,
          auth_code: auth_code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    console.log("📦 Token response code:", tokenData.code);

    if (tokenData.code !== 0) {
      console.error("❌ TikTok OAuth error:", tokenData.message);
      return new Response(
        JSON.stringify({ error: tokenData.message || "Failed to exchange token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.data.access_token;
    const advertiserIds = tokenData.data.advertiser_ids || [];

    console.log(`✅ Got access_token, ${advertiserIds.length} advertiser(s)`);

    // Save to user_integrations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: upsertError } = await supabaseAdmin
      .from("user_integrations")
      .upsert(
        {
          user_id: userId,
          platform: "tiktok_ads",
          access_token: accessToken,
          account_ids: advertiserIds.map(String),
          account_name: advertiserIds.length > 0 ? `TikTok Ads (${advertiserIds.length} accounts)` : "TikTok Ads",
          status: "connected",
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" }
      );

    if (upsertError) {
      console.error("❌ Upsert error:", upsertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to save integration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Integration saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        accountsCount: advertiserIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
