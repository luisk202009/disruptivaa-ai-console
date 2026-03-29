import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken } from "../_shared/crypto.ts";

const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://id-preview--qtjwzfbinsrmnvlsgvtw.lovable.app',
  'https://disruptivaa.lovable.app',
  'https://agentes.disruptivaa.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.some(allowed => 
    requestOrigin === allowed || 
    requestOrigin.endsWith('.lovable.app') || 
    requestOrigin.endsWith('.lovable.dev') ||
    requestOrigin.endsWith('.lovableproject.com') ||
    requestOrigin.endsWith('.disruptivaa.com')
  ) ? requestOrigin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

serve(async (req) => {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(requestOrigin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate configuration
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured");
      return new Response(
        JSON.stringify({ success: false, error: "OAuth de Google no configurado correctamente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase configuration missing");
    }

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseUserClient.auth.getUser(token);
    
    if (userError || !userData?.user?.id) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    // Parse request body
    const { code, redirect_uri } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "Código de autorización requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!redirect_uri) {
      return new Response(
        JSON.stringify({ success: false, error: "Redirect URI requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(`Processing Google OAuth exchange for user ${userId}`);

    // Exchange code for tokens via Google OAuth2
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Google token exchange failed:", tokenData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: tokenData.error_description || tokenData.error || "Error al obtener token de acceso" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.info(`Google tokens obtained. Access token expires in ${expiresIn} seconds`);
    console.info(`Refresh token ${refreshToken ? 'received' : 'NOT received'}`);

    // === Discover accessible Google Ads accounts ===
    const GOOGLE_ADS_DEVELOPER_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    let accountIds: string[] = [];
    let accountName = "Google Ads";

    if (GOOGLE_ADS_DEVELOPER_TOKEN) {
      try {
        console.info("Discovering Google Ads accounts...");
        const listResponse = await fetch(
          "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
            },
          }
        );

        if (listResponse.ok) {
          const listData = await listResponse.json();
          const resourceNames: string[] = listData.resourceNames || [];
          accountIds = resourceNames.map((rn: string) => rn.replace("customers/", ""));
          console.info(`Found ${accountIds.length} accessible accounts: ${accountIds.join(", ")}`);

          // Try to get descriptive names for the first account
          if (accountIds.length > 0) {
            try {
              const detailResponse = await fetch(
                `https://googleads.googleapis.com/v17/customers/${accountIds[0]}`,
                {
                  headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "developer-token": GOOGLE_ADS_DEVELOPER_TOKEN,
                    "login-customer-id": accountIds[0],
                  },
                }
              );
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                accountName = detailData.descriptiveName || `Google Ads (${accountIds.length} cuentas)`;
                console.info(`Account name: ${accountName}`);
              }
            } catch (nameErr) {
              console.warn("Could not fetch account name:", nameErr);
              accountName = `Google Ads (${accountIds.length} cuentas)`;
            }
          }
        } else {
          const errBody = await listResponse.text();
          console.warn("Could not list Google Ads accounts:", listResponse.status, errBody);
        }
      } catch (discoverErr) {
        console.warn("Google Ads account discovery failed:", discoverErr);
      }
    } else {
      console.warn("GOOGLE_ADS_DEVELOPER_TOKEN not set, skipping account discovery");
    }

    // Save to database using service role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existingIntegration } = await supabaseAdmin
      .from("user_integrations")
      .select("id, refresh_token")
      .eq("user_id", userId)
      .eq("platform", "google_ads")
      .maybeSingle();

    const finalRefreshToken = refreshToken || existingIntegration?.refresh_token || null;

    const integrationData = {
      user_id: userId,
      platform: "google_ads",
      status: "connected",
      connected_at: new Date().toISOString(),
      account_name: accountName,
      access_token: accessToken,
      refresh_token: finalRefreshToken,
      token_expires_at: tokenExpiresAt,
      account_ids: accountIds,
    };

    if (existingIntegration) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from("user_integrations")
        .update(integrationData)
        .eq("id", existingIntegration.id);

      if (updateError) {
        console.error("Error updating integration:", updateError);
        throw new Error("Error al guardar la conexión");
      }
    } else {
      // Insert new
      const { error: insertError } = await supabaseAdmin
        .from("user_integrations")
        .insert(integrationData);

      if (insertError) {
        console.error("Error inserting integration:", insertError);
        throw new Error("Error al guardar la conexión");
      }
    }

    console.info("Google Ads integration saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        hasRefreshToken: !!finalRefreshToken,
        expiresAt: tokenExpiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Google OAuth exchange error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Error interno del servidor" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
