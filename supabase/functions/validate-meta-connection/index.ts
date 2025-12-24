import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the access token from the request body (multi-tenant approach)
    const { access_token } = await req.json();

    if (!access_token) {
      console.log('❌ No access_token provided in request body');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Debes proporcionar un access_token de Meta Ads' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔄 Validating Meta connection with user-provided token...');
    console.log('Token prefix:', access_token.substring(0, 20) + '...');

    // Call Meta Graph API to get ad accounts
    const metaUrl = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${access_token}&fields=id,name,account_status`;
    console.log('📡 Calling Meta API...');

    const response = await fetch(metaUrl);
    const data = await response.json();

    console.log('📥 Meta API Response status:', response.status);
    console.log('📥 Meta API Response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('❌ Meta API Error:', data.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error.message || 'Error de autenticación con Meta' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (data.data && data.data.length > 0) {
      const accounts = data.data.map((acc: any) => ({
        id: acc.id,
        name: acc.name || acc.id,
        status: acc.account_status === 1 ? 'active' : 'inactive',
      }));

      console.log(`✅ Found ${accounts.length} ad account(s)`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          accounts: accounts.length,
          accountDetails: accounts,
          accountIds: accounts.map((a: any) => a.id),
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.log('⚠️ No ad accounts found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se encontraron cuentas de anuncios asociadas a este token' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: unknown) {
    console.error('❌ Server error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
