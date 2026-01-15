import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const META_APP_ID = Deno.env.get("META_APP_ID");
const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
}

// Fetch ad accounts from Meta API
async function fetchAdAccounts(accessToken: string): Promise<AdAccount[]> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error fetching ad accounts:", errorData);
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error in fetchAdAccounts:", error);
    return [];
  }
}

serve(async (req) => {
  const requestOrigin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(requestOrigin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate configuration
    if (!META_APP_ID || !META_APP_SECRET) {
      console.error("META_APP_ID or META_APP_SECRET not configured");
      return new Response(
        JSON.stringify({ success: false, error: "OAuth no configurado correctamente" }),
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

    console.info(`Processing OAuth exchange for user ${userId}`);

    // Step 1: Exchange code for short-lived token
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", META_APP_ID);
    tokenUrl.searchParams.set("redirect_uri", redirect_uri);
    tokenUrl.searchParams.set("client_secret", META_APP_SECRET);
    tokenUrl.searchParams.set("code", code);

    const shortTokenResponse = await fetch(tokenUrl.toString());
    const shortTokenData = await shortTokenResponse.json();

    if (!shortTokenResponse.ok || shortTokenData.error) {
      console.error("Short token exchange failed:", shortTokenData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: shortTokenData.error?.message || "Error al obtener token de acceso" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shortLivedToken = shortTokenData.access_token;
    console.info("Short-lived token obtained successfully");

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longTokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", META_APP_ID);
    longTokenUrl.searchParams.set("client_secret", META_APP_SECRET);
    longTokenUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longTokenResponse = await fetch(longTokenUrl.toString());
    const longTokenData = await longTokenResponse.json();

    if (!longTokenResponse.ok || longTokenData.error) {
      console.error("Long token exchange failed:", longTokenData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: longTokenData.error?.message || "Error al obtener token de larga duración" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const longLivedToken = longTokenData.access_token;
    // Meta returns expires_in in seconds (usually ~5184000 for 60 days)
    const expiresIn = longTokenData.expires_in || 5184000;
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    console.info(`Long-lived token obtained. Expires in ${Math.round(expiresIn / 86400)} days`);

    // Step 3: Fetch ad accounts
    const adAccounts = await fetchAdAccounts(longLivedToken);
    const accountIds = adAccounts.map(a => a.id);
    const accountName = adAccounts.length > 0 
      ? `${adAccounts.length} cuenta(s) de anuncios`
      : "Meta Ads";

    console.info(`Found ${adAccounts.length} ad account(s)`);

    // Step 4: Save to database using service role (bypasses RLS for upsert)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user already has a Meta integration
    const { data: existingIntegration } = await supabaseAdmin
      .from("user_integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "meta_ads")
      .maybeSingle();

    const integrationData = {
      user_id: userId,
      platform: "meta_ads",
      status: "connected",
      connected_at: new Date().toISOString(),
      account_name: accountName,
      access_token: longLivedToken,
      token_expires_at: tokenExpiresAt,
      account_ids: accountIds,
      meta_app_id: META_APP_ID,
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

    console.info("Integration saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        accountsCount: adAccounts.length,
        accountDetails: adAccounts.map(a => ({
          id: a.id,
          name: a.name,
          status: a.account_status === 1 ? "ACTIVE" : "INACTIVE",
        })),
        expiresAt: tokenExpiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("OAuth exchange error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Error interno del servidor" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
