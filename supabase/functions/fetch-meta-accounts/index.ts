import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccountRequest {
  account_ids: string[];
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

    // Verify requested accounts belong to user
    const validAccountIds = account_ids.filter((id) =>
      integration.account_ids?.includes(id)
    );

    // Fetch account details from Meta API
    const accounts = await Promise.all(
      validAccountIds.map(async (accountId) => {
        try {
          const response = await fetch(
            `https://graph.facebook.com/v21.0/act_${accountId}?fields=name,account_status&access_token=${integration.access_token}`
          );
          const data = await response.json();

          if (data.error) {
            console.error(`Error fetching account ${accountId}:`, data.error);
            return {
              id: accountId,
              name: `Cuenta ${accountId}`,
              status: "unknown",
            };
          }

          return {
            id: accountId,
            name: data.name || `Cuenta ${accountId}`,
            status: data.account_status === 1 ? "active" : "inactive",
          };
        } catch (error) {
          console.error(`Error fetching account ${accountId}:`, error);
          return {
            id: accountId,
            name: `Cuenta ${accountId}`,
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
