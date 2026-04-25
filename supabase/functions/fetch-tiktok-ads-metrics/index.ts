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

  const previousUntil = new Date(currentSince);
  previousUntil.setDate(previousUntil.getDate() - 1);
  const previousSince = new Date(previousUntil);
  previousSince.setDate(previousSince.getDate() - daysDiff + 1);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    current: { since: formatDate(currentSince), until: formatDate(currentUntil) },
    previous: { since: formatDate(previousSince), until: formatDate(previousUntil) },
  };
}

// Map our metrics to TikTok Ads API fields
const metricFieldMap: Record<string, string> = {
  impressions: "show_cnt",
  clicks: "click_cnt",
  spend: "spend",
  reach: "reach",
  ctr: "ctr",
  cpc: "cpc",
  cpm: "cpm",
  conversions: "conversion",
  cpa: "cost_per_conversion",
  roas: "value_per_cost",
};

// TikTok API metric names for the report request
const tiktokApiMetrics = [
  "spend", "show_cnt", "click_cnt", "conversion", "ctr", "cpc", "cpm",
  "cost_per_conversion", "value_per_cost",
];

async function fetchTikTokReport(
  accessToken: string,
  advertiserId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/",
    {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        data_level: "AUCTION_ADVERTISER",
        dimensions: ["stat_time_day"],
        metrics: tiktokApiMetrics,
        start_date: startDate,
        end_date: endDate,
        page_size: 365,
      }),
    }
  );

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error("❌ TikTok API returned non-JSON response:", response.status, text.substring(0, 200));
    throw new Error(`TikTok API returned non-JSON response (status ${response.status}). Token may be expired.`);
  }

  const data = await response.json();
  
  if (data.code !== 0) {
    console.error("❌ TikTok API error:", data.message);
    throw new Error(data.message || "TikTok API error");
  }

  // Aggregate daily data
  const totals: Record<string, number> = {};
  const rows = data.data?.list || [];

  for (const row of rows) {
    const metrics = row.metrics || {};
    for (const [key, value] of Object.entries(metrics)) {
      const numVal = Number(value) || 0;
      totals[key] = (totals[key] || 0) + numVal;
    }
  }

  // Recalculate rate metrics as averages
  if (rows.length > 0) {
    for (const key of ["ctr", "cpc", "cpm", "cost_per_conversion", "value_per_cost"]) {
      if (totals[key]) {
        totals[key] = totals[key] / rows.length;
      }
    }
  }

  return totals;
}

function extractMetricValue(totals: Record<string, number>, metric: string): number {
  const tiktokField = metricFieldMap[metric] || metric;
  return Math.round((totals[tiktokField] || 0) * 100) / 100;
}

// Demo data generators (fallback)
function generateDemoValue(metric: string): number {
  switch (metric) {
    case "impressions": return Math.floor(15000 + Math.random() * 60000);
    case "clicks": return Math.floor(800 + Math.random() * 3000);
    case "spend": return Math.round((150 + Math.random() * 600) * 100) / 100;
    case "reach": return Math.floor(12000 + Math.random() * 50000);
    case "ctr": return Math.round((1.5 + Math.random() * 4) * 100) / 100;
    case "cpc": return Math.round((0.3 + Math.random() * 1.2) * 100) / 100;
    case "cpm": return Math.round((4 + Math.random() * 12) * 100) / 100;
    case "conversions": return Math.floor(15 + Math.random() * 120);
    case "cpa": return Math.round((5 + Math.random() * 15) * 100) / 100;
    case "roas": return Math.round((1.5 + Math.random() * 4) * 100) / 100;
    default: return Math.floor(1500 + Math.random() * 6000);
  }
}

function generateDemoDataPoints(datePreset: string, metric: string): { date: string; value: number }[] {
  const days = datePreset === "last_30d" ? 30 : datePreset === "last_7d" ? 7 : 1;
  const dataPoints: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dataPoints.push({
      date: date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }),
      value: generateDemoValue(metric) / days,
    });
  }
  return dataPoints;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // Decode JWT
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payloadBase64 = token.split(".")[1];
      const payload = JSON.parse(atob(payloadBase64));
      userId = payload.sub;
      if (!userId) throw new Error("No sub claim");
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: MetricRequest = await req.json();
    const { metric, date_preset, account_id, comparison = true } = body;

    console.log(`📊 TikTok metrics: user=${userId}, metric=${metric}, preset=${date_preset}`);

    // --- Cache check ---
    const cacheKey = `tiktok_ads:${metric}:${date_preset}:${account_id || "default"}`;
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

    // Get user's TikTok integration
    const { data: integration } = await supabaseAdmin
      .from("user_integrations")
      .select("access_token, account_ids")
      .eq("user_id", userId)
      .eq("platform", "tiktok_ads")
      .eq("status", "connected")
      .single();

    if (!integration?.access_token || !integration.account_ids?.length) {
      console.log("ℹ️ No TikTok integration, returning demo data");
      const demoValue = generateDemoValue(metric);
      return new Response(
        JSON.stringify({
          value: demoValue,
          previous_value: demoValue * 0.85,
          change_percent: 15,
          trend: "up",
          data_points: generateDemoDataPoints(date_preset, metric),
          is_demo: true,
          platform: "tiktok_ads",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetAccountId = account_id || integration.account_ids[0];
    const decryptedAccessToken = await decryptToken(integration.access_token);
    const dateRanges = calculateDateRanges(date_preset);

    console.log(`📊 Fetching real TikTok data for account ${targetAccountId}`);

    // Fetch current period
    let currentTotals: Record<string, number>;
    try {
      currentTotals = await fetchTikTokReport(
        decryptedAccessToken,
        targetAccountId,
        dateRanges.current.since,
        dateRanges.current.until
      );
    } catch (e) {
      const errMsg = (e as Error).message;
      console.warn("⚠️ Failed to fetch TikTok current period, returning demo data:", errMsg);
      const isTokenExpired = errMsg?.includes("Token may be expired") || 
        errMsg?.includes("non-JSON response") ||
        errMsg?.includes("auth") ||
        errMsg?.includes("unauthorized");
      const demoValue = generateDemoValue(metric);
      return new Response(
        JSON.stringify({
          value: demoValue,
          previous_value: demoValue * 0.85,
          change_percent: 15,
          trend: "up",
          data_points: generateDemoDataPoints(date_preset, metric),
          is_demo: true,
          token_expired: isTokenExpired,
          platform: "tiktok_ads",
          error_message: errMsg,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const value = extractMetricValue(currentTotals, metric);

    let previousValue: number | undefined;
    let changePercent: number | undefined;
    let trend = "neutral";

    if (comparison) {
      try {
        const previousTotals = await fetchTikTokReport(
          decryptedAccessToken,
          targetAccountId,
          dateRanges.previous.since,
          dateRanges.previous.until
        );
        previousValue = extractMetricValue(previousTotals, metric);
        if (previousValue > 0) {
          changePercent = ((value - previousValue) / previousValue) * 100;
          trend = changePercent > 1 ? "up" : changePercent < -1 ? "down" : "neutral";
        }
      } catch (e) {
        console.warn("⚠️ Could not fetch comparison data:", (e as Error).message);
      }
    }

    const responsePayload = {
      value,
      previous_value: previousValue,
      change_percent: changePercent != null ? Math.round(changePercent * 100) / 100 : undefined,
      trend,
      data_points: [],
      previous_data_points: [],
      account_name: `TikTok Ads ${targetAccountId}`,
      currency: "USD",
      is_demo: false,
      platform: "tiktok_ads",
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
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
