import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://id-preview--qtjwzfbinsrmnvlsgvtw.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.some(allowed => 
    requestOrigin === allowed || requestOrigin.endsWith('.lovable.app') || requestOrigin.endsWith('.lovable.dev')
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
  
  // Meta tokens are typically 150-500 characters
  if (token.length < 50 || token.length > 600) {
    return { valid: false, error: 'Token length is invalid' };
  }
  
  // Check for basic alphanumeric pattern (Meta tokens use alphanumeric + some special chars)
  if (!/^[A-Za-z0-9_|-]+$/.test(token)) {
    return { valid: false, error: 'Token contains invalid characters' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the access token from the request body (multi-tenant approach)
    const { access_token } = await req.json();

    if (!access_token) {
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

    // Validate token format before making API call
    const formatValidation = validateTokenFormat(access_token);
    if (!formatValidation.valid) {
      console.info('Token format validation failed');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token format invalid' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.info('Validating Meta connection');

    // Call Meta Graph API to get ad accounts
    const metaUrl = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${access_token}&fields=id,name,account_status`;

    const response = await fetch(metaUrl);
    const data = await response.json();

    if (data.error) {
      console.error('Meta API validation failed');
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

      console.info(`Validation successful: ${accounts.length} account(s)`);
      
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
      console.info('No ad accounts found for token');
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
    console.error('Server error occurred');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
