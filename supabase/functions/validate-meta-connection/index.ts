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

  console.log('🔄 Validating Meta Ads connection...');

  try {
    const accessToken = Deno.env.get('META_ACCESS_TOKEN');
    
    if (!accessToken) {
      console.error('❌ META_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token de acceso de Meta no configurado en secrets' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📤 Calling Meta Graph API...');
    
    // Real call to Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status`
    );

    const data = await response.json();
    console.log('📥 Meta API Response Status:', response.status);
    console.log('📥 Meta API Response:', JSON.stringify(data));

    if (response.ok && data.data) {
      const accounts = data.data.map((acc: { id: string; name: string; account_status: number }) => ({
        id: acc.id,
        name: acc.name,
        status: acc.account_status === 1 ? 'active' : 'inactive'
      }));
      
      console.log(`✅ Successfully validated. Found ${accounts.length} ad accounts`);
      
      return new Response(
        JSON.stringify({
          success: true,
          accounts: accounts.length,
          accountDetails: accounts,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      const errorMessage = data.error?.message || 'Error de autenticación con Meta';
      console.error('❌ Meta API Error:', errorMessage);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('❌ Error in validate-meta-connection:', errorMessage);
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
