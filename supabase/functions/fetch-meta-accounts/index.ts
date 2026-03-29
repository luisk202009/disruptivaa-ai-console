import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = [
  'https://disruptivaa.lovable.app',
  'https://agentes.disruptivaa.com',
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && (
    ALLOWED_ORIGINS.includes(requestOrigin) ||
    requestOrigin.endsWith('.lovable.app') ||
    requestOrigin.endsWith('.lovable.dev') ||
    requestOrigin.endsWith('.lovableproject.com') ||
    requestOrigin.endsWith('.disruptivaa.com') ||
    requestOrigin === 'http://localhost:5173' ||
    requestOrigin === 'http://localhost:3000'
  ) ? requestOrigin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface AccountRequest {
  account_ids: string[];
}

// Normalize account ID - remove 'act_' prefix if already present
function normalizeAccountId(accountId: string): string {
  return accountId.startsWith("act_") ? accountId.slice(4) : accountId;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AccountRequest = await req.json();
    const { account_ids } = body;

    if (!account_ids?.length) {
      return new Response(
        JSON.stringify({ accounts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's access token
    const { data: integration } = await supabaseAdmin
      .from("user_integrations")
      .select("access_token, account_ids")
      .eq("user_id", user.id)
      .eq("platform", "meta_ads")
      .eq("status", "connected")
      .single();

    if (!integration?.access_token) {
      return new Response(
        JSON.stringify({ error: "No Meta connection found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize all account IDs for comparison
    const normalizedRequestIds = account_ids.map(normalizeAccountId);
    const normalizedUserAccounts = (integration.account_ids || []).map(normalizeAccountId);

    // Verify requested accounts belong to user
    const validAccountIds = normalizedRequestIds.filter((id) =>
      normalizedUserAccounts.includes(id)
    );

    console.log(`📊 Fetching ${validAccountIds.length} account details`);

    // Fetch account details from Meta API
    const accounts = await Promise.all(
      validAccountIds.map(async (cleanAccountId) => {
        try {
          // Use normalized ID with act_ prefix for API call
          const response = await fetch(
            `https://graph.facebook.com/v21.0/act_${cleanAccountId}?fields=name,account_status&access_token=${integration.access_token}`
          );
          const data = await response.json();

          if (data.error) {
            console.error(`Error fetching account ${cleanAccountId}:`, data.error);
            return {
              id: cleanAccountId,
              name: `Cuenta ${cleanAccountId}`,
              status: "unknown",
            };
          }

          console.log(`✅ Account ${cleanAccountId}: ${data.name}`);

          return {
            id: cleanAccountId,
            name: data.name || `Cuenta ${cleanAccountId}`,
            status: data.account_status === 1 ? "active" : "inactive",
          };
        } catch (error) {
          console.error(`Error fetching account ${cleanAccountId}:`, error);
          return {
            id: cleanAccountId,
            name: `Cuenta ${cleanAccountId}`,
            status: "unknown",
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ accounts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
