import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encryptToken } from "../_shared/crypto.ts";

// Allowed origins for CORS - restrict to known domains
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
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Validate token format before making API calls
function validateTokenFormat(token: string): { valid: boolean; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is required' };
  }
  
  if (token.length < 50 || token.length > 600) {
    return { valid: false, error: 'Token length is invalid' };
  }
  
  if (!/^[A-Za-z0-9_|-]+$/.test(token)) {
    return { valid: false, error: 'Token contains invalid characters' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, save } = await req.json();

    if (!access_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Debes proporcionar un access_token de Meta Ads' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate token format
    const formatValidation = validateTokenFormat(access_token);
    if (!formatValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token format invalid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info('Validating Meta connection');

    // Call Meta Graph API to get ad accounts
    const metaUrl = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${access_token}&fields=id,name,account_status`;
    const response = await fetch(metaUrl);
    const data = await response.json();

    if (data.error) {
      return new Response(
        JSON.stringify({ success: false, error: data.error.message || 'Error de autenticación con Meta' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data.data || data.data.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No se encontraron cuentas de anuncios asociadas a este token' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accounts = data.data.map((acc: any) => ({
      id: acc.id,
      name: acc.name || acc.id,
      status: acc.account_status === 1 ? 'active' : 'inactive',
    }));

    console.info(`Validation successful: ${accounts.length} account(s)`);

    // If save=true and auth header present, encrypt and save to database
    if (save) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authorization required to save integration' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Verify user
      const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userError } = await supabaseUserClient.auth.getUser();
      if (userError || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid user token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = userData.user.id;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Encrypt the token before saving
      const encryptedToken = await encryptToken(access_token);

      const accountName = `${accounts.length} cuenta(s) de anuncios`;
      const accountIds = accounts.map((a: any) => a.id);

      const integrationData = {
        user_id: userId,
        platform: "meta_ads",
        status: "connected",
        connected_at: new Date().toISOString(),
        account_name: accountName,
        access_token: encryptedToken,
        account_ids: accountIds,
      };

      // Upsert integration
      const { data: existing } = await supabaseAdmin
        .from("user_integrations")
        .select("id")
        .eq("user_id", userId)
        .eq("platform", "meta_ads")
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabaseAdmin
          .from("user_integrations")
          .update(integrationData)
          .eq("id", existing.id);
        if (updateError) throw new Error("Error saving integration");
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("user_integrations")
          .insert(integrationData);
        if (insertError) throw new Error("Error saving integration");
      }

      console.info("Integration saved with encrypted token");
    }

    return new Response(
      JSON.stringify({
        success: true,
        accounts: accounts.length,
        accountDetails: accounts,
        accountIds: accounts.map((a: any) => a.id),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Server error occurred');
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
