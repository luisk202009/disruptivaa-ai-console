import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const todayStr = today.toISOString().split("T")[0];
  
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

    const body: MetricRequest = await req.json();
    const { metric, date_preset, account_id, comparison = true } = body;

    // Get user's Meta integration
    const { data: integration } = await supabaseAdmin
      .from("user_integrations")
      .select("access_token, account_ids")
      .eq("user_id", user.id)
      .eq("platform", "meta_ads")
      .eq("status", "connected")
      .single();

    if (!integration?.access_token || !integration.account_ids?.length) {
      // Return demo data if no integration
      return new Response(
        JSON.stringify(generateDemoData(metric, date_preset)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate account_id is owned by user
    const targetAccountId = account_id || integration.account_ids[0];
    if (!integration.account_ids.includes(targetAccountId)) {
      return new Response(
        JSON.stringify({ error: "Invalid account ID" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = integration.access_token;
    const field = metricFieldMap[metric] || "impressions";
    const dateRanges = calculateDateRanges(date_preset);

    console.log(`📊 Fetching ${metric} for account ${targetAccountId}`);
    console.log(`📅 Current period: ${dateRanges.current.since} to ${dateRanges.current.until}`);
    console.log(`📅 Previous period: ${dateRanges.previous.since} to ${dateRanges.previous.until}`);

    // Fetch current period data with daily breakdown
    const currentDataPoints = await fetchInsightsWithDailyBreakdown(
      targetAccountId,
      accessToken,
      field,
      dateRanges.current.since,
      dateRanges.current.until
    );

    if ("error" in currentDataPoints) {
      console.error("Meta API error (current):", currentDataPoints.error);
      return new Response(
        JSON.stringify(generateDemoData(metric, date_preset)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate current total value
    const currentValue = currentDataPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Fetch previous period for comparison
    let previousValue: number | undefined;
    let changePercent: number | undefined;
    let trend: "up" | "down" | "neutral" = "neutral";

    if (comparison) {
      const previousDataPoints = await fetchInsightsWithDailyBreakdown(
        targetAccountId,
        accessToken,
        field,
        dateRanges.previous.since,
        dateRanges.previous.until
      );

      if (!("error" in previousDataPoints)) {
        previousValue = previousDataPoints.reduce((sum, dp) => sum + dp.value, 0);
        
        if (previousValue > 0) {
          changePercent = ((currentValue - previousValue) / previousValue) * 100;
          trend = changePercent > 1 ? "up" : changePercent < -1 ? "down" : "neutral";
        }
      }
    }

    // Get account name
    let accountName = `Cuenta ${targetAccountId}`;
    try {
      const accountResponse = await fetch(
        `https://graph.facebook.com/v21.0/act_${targetAccountId}?fields=name&access_token=${accessToken}`
      );
      const accountData = await accountResponse.json();
      if (accountData.name) {
        accountName = accountData.name;
      }
    } catch (e) {
      console.warn("Could not fetch account name:", e);
    }

    return new Response(
      JSON.stringify({
        value: currentValue,
        previous_value: previousValue,
        change_percent: changePercent,
        trend,
        data_points: currentDataPoints,
        account_name: accountName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching metric:", error);
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

  try {
    const response = await fetch(insightsUrl.toString());
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    // Normalize Meta response to our format
    const dataPoints = (data.data || []).map((item: any) => ({
      date: formatDateLabel(item.date_start),
      value: parseFloat(item[field] || "0"),
    }));

    return dataPoints;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function generateDemoData(metric: string, datePreset: string) {
  const baseValues: Record<string, number> = {
    impressions: 150000,
    clicks: 4500,
    spend: 1250.50,
    reach: 85000,
    ctr: 2.35,
    cpc: 0.28,
    cpm: 8.50,
  };

  const value = baseValues[metric] || 1000;
  const previousValue = value * (0.85 + Math.random() * 0.3);
  const changePercent = ((value - previousValue) / previousValue) * 100;

  return {
    value,
    previous_value: previousValue,
    change_percent: changePercent,
    trend: changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral",
    data_points: generateDataPoints(value, datePreset),
    is_demo: true,
  };
}

function generateDataPoints(baseValue: number, datePreset: string) {
  const dayCount = datePreset === "last_30d" ? 30 : datePreset === "last_7d" ? 7 : 1;
  const points = [];
  
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    points.push({
      date: date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }),
      value: (baseValue / dayCount) * (0.7 + Math.random() * 0.6),
    });
  }

  return points;
}
