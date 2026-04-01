import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { decryptToken } from "../_shared/crypto.ts";

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

interface MetricRequest {
  metric: string;
  date_preset: string;
  account_id?: string;
  comparison?: boolean;
}

interface DateRange {
  since: string;
  until: string;
}

// Calculate date ranges based on preset
function calculateDateRanges(datePreset: string): { current: DateRange; previous: DateRange } {
  const today = new Date();
  
  let currentSince: Date;
  let currentUntil: Date = today;
  let daysDiff: number;

  switch (datePreset) {
    case "today":
      currentSince = new Date(today);
      daysDiff = 1;
      break;
    case "yesterday":
      currentSince = new Date(today);
      currentSince.setDate(currentSince.getDate() - 1);
      currentUntil = new Date(currentSince);
      daysDiff = 1;
      break;
    case "last_7d":
      currentSince = new Date(today);
      currentSince.setDate(currentSince.getDate() - 6);
      daysDiff = 7;
      break;
    case "last_30d":
      currentSince = new Date(today);
      currentSince.setDate(currentSince.getDate() - 29);
      daysDiff = 30;
      break;
    case "this_month":
      currentSince = new Date(today.getFullYear(), today.getMonth(), 1);
      daysDiff = today.getDate();
      break;
    default:
      currentSince = new Date(today);
      currentSince.setDate(currentSince.getDate() - 6);
      daysDiff = 7;
  }

  // Calculate previous period (same duration, immediately before)
  const previousUntil = new Date(currentSince);
  previousUntil.setDate(previousUntil.getDate() - 1);
  const previousSince = new Date(previousUntil);
  previousSince.setDate(previousSince.getDate() - daysDiff + 1);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    current: {
      since: formatDate(currentSince),
      until: formatDate(currentUntil),
    },
    previous: {
      since: formatDate(previousSince),
      until: formatDate(previousUntil),
    },
  };
}

// Format date for display
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
}

// Map our metrics to Meta API fields
const metricFieldMap: Record<string, string> = {
  impressions: "impressions",
  clicks: "clicks",
  spend: "spend",
  reach: "reach",
  ctr: "ctr",
  cpc: "cpc",
  cpm: "cpm",
};

// Normalize account ID - remove 'act_' prefix if already present to avoid duplication
function normalizeAccountId(accountId: string): string {
  return accountId.startsWith("act_") ? accountId.slice(4) : accountId;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Decode JWT to extract user ID (reliable in signing-keys environment)
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      userId = payload.sub;
      if (!userId) throw new Error("No sub claim");
    } catch (e) {
      console.error("❌ Invalid token:", e.message);
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("👤 User authenticated successfully");

    const body: MetricRequest = await req.json();
    const { metric, date_preset, account_id, comparison = true } = body;

    console.log(`📊 Request: metric=${metric}, date_preset=${date_preset}`);

    // --- Cache check ---
    const cacheKey = `meta_ads:${metric}:${date_preset}:${account_id || "default"}`;
    const { data: cached } = await supabaseAdmin
      .from("metrics_cache")
      .select("response")
      .eq("user_id", userId)
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.response) {
      console.log(`⚡ Cache hit for ${cacheKey}`);
      return new Response(
        JSON.stringify(cached.response),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log(`🔄 Cache miss for ${cacheKey}`);

    // Get user's Meta integration using service role key
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from("user_integrations")
      .select("access_token, account_ids")
      .eq("user_id", userId)
      .eq("platform", "meta_ads")
      .eq("status", "connected")
      .single();

    if (integrationError) {
      console.error("❌ Error fetching integration:", integrationError.message);
    }

    if (!integration?.access_token) {
      console.error("❌ No access token found for user");
      return new Response(
        JSON.stringify({ 
          error: "No Meta Ads integration found",
          is_demo: true,
          value: 0,
          data_points: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!integration.account_ids?.length) {
      console.error("❌ No account IDs found for user");
      return new Response(
        JSON.stringify({ 
          error: "No ad accounts connected",
          is_demo: true,
          value: 0,
          data_points: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found integration with ${integration.account_ids.length} accounts`);

    // Validate account_id is owned by user
    const targetAccountId = account_id || integration.account_ids[0];
    
    // Normalize account IDs for comparison (strip act_ prefix if present)
    const normalizedTargetId = normalizeAccountId(targetAccountId);
    const normalizedUserAccounts = integration.account_ids.map(normalizeAccountId);
    
    if (!normalizedUserAccounts.includes(normalizedTargetId)) {
      console.error(`❌ Account ${targetAccountId} not in user's accounts: ${integration.account_ids.join(", ")}`);
      return new Response(
        JSON.stringify({ error: "Invalid account ID" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await decryptToken(integration.access_token);
    const field = metricFieldMap[metric] || "impressions";
    const dateRanges = calculateDateRanges(date_preset);
    
    // Use normalized ID for API calls (without act_ prefix - we add it ourselves)
    const cleanAccountId = normalizedTargetId;

    console.log(`📊 Fetching ${metric} (field: ${field}) for account act_${cleanAccountId}`);
    console.log(`📅 Current period: ${dateRanges.current.since} to ${dateRanges.current.until}`);
    console.log(`📅 Previous period: ${dateRanges.previous.since} to ${dateRanges.previous.until}`);

    // Fetch current period data with daily breakdown
    const currentDataPoints = await fetchInsightsWithDailyBreakdown(
      cleanAccountId,
      accessToken,
      field,
      dateRanges.current.since,
      dateRanges.current.until
    );

    if ("error" in currentDataPoints) {
      console.error("❌ Meta API error (current):", currentDataPoints.error);
      return new Response(
        JSON.stringify({ 
          error: currentDataPoints.error,
          token_expired: !!(currentDataPoints as any).token_expired,
          is_demo: !!(currentDataPoints as any).token_expired,
          value: 0,
          data_points: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Fetched ${currentDataPoints.length} data points for current period`);

    // Calculate current total value
    const currentValue = currentDataPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Fetch previous period for comparison
    let previousValue: number | undefined;
    let changePercent: number | undefined;
    let trend: "up" | "down" | "neutral" = "neutral";

    let previousDataPointsResult: { date: string; value: number }[] = [];

    if (comparison) {
      const previousDataPoints = await fetchInsightsWithDailyBreakdown(
        cleanAccountId,
        accessToken,
        field,
        dateRanges.previous.since,
        dateRanges.previous.until
      );

      if (!("error" in previousDataPoints)) {
        previousDataPointsResult = previousDataPoints;
        previousValue = previousDataPoints.reduce((sum, dp) => sum + dp.value, 0);
        console.log(`✅ Previous period value: ${previousValue}`);
        
        if (previousValue > 0) {
          changePercent = ((currentValue - previousValue) / previousValue) * 100;
          trend = changePercent > 1 ? "up" : changePercent < -1 ? "down" : "neutral";
        }
      }
    }

    // Get account name and currency
    let accountName = `Cuenta act_${cleanAccountId}`;
    let currency = "USD";
    try {
      const accountResponse = await fetch(
        `https://graph.facebook.com/v21.0/act_${cleanAccountId}?fields=name,currency&access_token=${accessToken}`
      );
      const accountData = await accountResponse.json();
      if (accountData.name) {
        accountName = accountData.name;
      }
      if (accountData.currency) {
        currency = accountData.currency;
      }
    } catch (e) {
      console.warn("⚠️ Could not fetch account name/currency:", e);
    }

    console.log(`✅ Successfully fetched metrics for ${accountName}`);

    const responsePayload = {
      value: currentValue,
      previous_value: previousValue,
      change_percent: changePercent,
      trend,
      data_points: currentDataPoints,
      previous_data_points: previousDataPointsResult.length > 0 ? previousDataPointsResult : undefined,
      account_name: accountName,
      currency,
      is_demo: false,
    };

    // --- Cache write ---
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("metrics_cache")
      .upsert({
        user_id: userId,
        cache_key: cacheKey,
        response: responsePayload,
        expires_at: expiresAt,
      }, { onConflict: "user_id,cache_key" })
      .then(({ error }) => { if (error) console.warn("⚠️ Cache write error:", error.message); });

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error fetching metric:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fetch insights with time_increment=1 for daily breakdown
async function fetchInsightsWithDailyBreakdown(
  accountId: string,
  accessToken: string,
  field: string,
  since: string,
  until: string
): Promise<{ date: string; value: number }[] | { error: string }> {
  const insightsUrl = new URL(`https://graph.facebook.com/v21.0/act_${accountId}/insights`);
  insightsUrl.searchParams.append("access_token", accessToken);
  insightsUrl.searchParams.append("fields", field);
  insightsUrl.searchParams.append("time_range", JSON.stringify({ since, until }));
  insightsUrl.searchParams.append("time_increment", "1"); // Daily breakdown

  console.log(`🔗 Fetching from Meta API: ${insightsUrl.toString().replace(accessToken, "***")}`);

  try {
    const response = await fetch(insightsUrl.toString());
    const data = await response.json();

    if (data.error) {
      console.error("❌ Meta API error:", data.error);
      // Detect expired/invalid token errors
      const isTokenExpired = data.error.type === "OAuthException" || 
        data.error.code === 190 || 
        (data.error.message && (
          data.error.message.includes("Session has expired") ||
          data.error.message.includes("session has been invalidated") ||
          data.error.message.includes("access token")
        ));
      return { error: data.error.message, token_expired: isTokenExpired };
    }

    // Normalize Meta response to our format
    const dataPoints = (data.data || []).map((item: any) => ({
      date: formatDateLabel(item.date_start),
      value: parseFloat(item[field] || "0"),
    }));

    console.log(`✅ Parsed ${dataPoints.length} data points from Meta response`);

    return dataPoints;
  } catch (error) {
    console.error("❌ Fetch error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
