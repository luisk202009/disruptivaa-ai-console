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

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
}

// Map our metrics to Google Ads API fields
const metricFieldMap: Record<string, string> = {
  impressions: "metrics.impressions",
  clicks: "metrics.clicks",
  spend: "metrics.cost_micros",
  reach: "metrics.impressions", // Google doesn't have reach, use impressions
  ctr: "metrics.ctr",
  cpc: "metrics.average_cpc",
  cpm: "metrics.average_cpm",
  conversions: "metrics.conversions",
};

serve(async (req) => {
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

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("❌ Invalid user:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`👤 User authenticated: ${user.id}`);

    const body: MetricRequest = await req.json();
    const { metric, date_preset, account_id, comparison = true } = body;

    console.log(`📊 Request: metric=${metric}, date_preset=${date_preset}, account_id=${account_id}`);

    // Get user's Google Ads integration
    const { data: integration, error: integrationError } = await supabaseAdmin
      .from("user_integrations")
      .select("access_token, account_ids, refresh_token")
      .eq("user_id", user.id)
      .eq("platform", "google_ads")
      .eq("status", "connected")
      .single();

    if (integrationError) {
      console.error("❌ Error fetching integration:", integrationError.message);
    }

    if (!integration?.access_token) {
      console.log("ℹ️ No Google Ads integration found, returning demo data");
      return new Response(
        JSON.stringify({ 
          error: "No Google Ads integration found",
          is_demo: true,
          value: generateDemoValue(metric),
          previous_value: generateDemoValue(metric) * 0.9,
          change_percent: 10,
          trend: "up",
          data_points: generateDemoDataPoints(date_preset, metric),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!integration.account_ids?.length) {
      console.log("ℹ️ No account IDs found, returning demo data");
      return new Response(
        JSON.stringify({ 
          error: "No ad accounts connected",
          is_demo: true,
          value: generateDemoValue(metric),
          previous_value: generateDemoValue(metric) * 0.9,
          change_percent: 10,
          trend: "up",
          data_points: generateDemoDataPoints(date_preset, metric),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetAccountId = account_id || integration.account_ids[0];
    const dateRanges = calculateDateRanges(date_preset);

    console.log(`📊 Fetching ${metric} for Google Ads account ${targetAccountId}`);

    // Note: In production, you would call the Google Ads API here
    // For now, return demo data with proper structure
    const demoValue = generateDemoValue(metric);
    const previousValue = demoValue * (0.8 + Math.random() * 0.4);
    const changePercent = ((demoValue - previousValue) / previousValue) * 100;

    return new Response(
      JSON.stringify({
        value: demoValue,
        previous_value: comparison ? previousValue : undefined,
        change_percent: comparison ? changePercent : undefined,
        trend: changePercent > 1 ? "up" : changePercent < -1 ? "down" : "neutral",
        data_points: generateDemoDataPoints(date_preset, metric),
        account_name: `Google Ads ${targetAccountId}`,
        is_demo: true,
        platform: "google_ads",
      }),
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

function generateDemoValue(metric: string): number {
  switch (metric) {
    case "impressions":
      return Math.floor(10000 + Math.random() * 50000);
    case "clicks":
      return Math.floor(500 + Math.random() * 2000);
    case "spend":
      return Math.round((100 + Math.random() * 500) * 100) / 100;
    case "reach":
      return Math.floor(8000 + Math.random() * 40000);
    case "ctr":
      return Math.round((1 + Math.random() * 3) * 100) / 100;
    case "cpc":
      return Math.round((0.5 + Math.random() * 1.5) * 100) / 100;
    case "cpm":
      return Math.round((5 + Math.random() * 15) * 100) / 100;
    case "conversions":
      return Math.floor(10 + Math.random() * 100);
    default:
      return Math.floor(1000 + Math.random() * 5000);
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
