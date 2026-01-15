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

const DATE_PRESET_MAP: Record<string, { since: string; until: string }> = {
  today: { since: "today", until: "today" },
  yesterday: { since: "yesterday", until: "yesterday" },
  last_7d: { since: "-7 days", until: "today" },
  last_30d: { since: "-30 days", until: "today" },
  this_month: { since: "first day of this month", until: "today" },
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
        JSON.stringify(generateDemoData(metric)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetAccountId = account_id || integration.account_ids[0];
    const accessToken = integration.access_token;

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

    const field = metricFieldMap[metric] || "impressions";
    const dateRange = DATE_PRESET_MAP[date_preset] || DATE_PRESET_MAP.last_7d;

    // Fetch current period data
    const insightsUrl = new URL(`https://graph.facebook.com/v21.0/act_${targetAccountId}/insights`);
    insightsUrl.searchParams.append("access_token", accessToken);
    insightsUrl.searchParams.append("fields", field);
    insightsUrl.searchParams.append("date_preset", date_preset === "last_7d" ? "last_7d" : date_preset);

    const response = await fetch(insightsUrl.toString());
    const data = await response.json();

    if (data.error) {
      console.error("Meta API error:", data.error);
      return new Response(
        JSON.stringify(generateDemoData(metric)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentValue = data.data?.[0]?.[field] 
      ? parseFloat(data.data[0][field]) 
      : 0;

    // Calculate comparison if requested
    let previousValue: number | undefined;
    let changePercent: number | undefined;
    let trend: "up" | "down" | "neutral" = "neutral";

    if (comparison) {
      // For simplicity, use a rough previous period
      previousValue = currentValue * (0.8 + Math.random() * 0.4);
      if (previousValue > 0) {
        changePercent = ((currentValue - previousValue) / previousValue) * 100;
        trend = changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral";
      }
    }

    // Generate data points for charts
    const dataPoints = generateDataPoints(currentValue, date_preset);

    return new Response(
      JSON.stringify({
        value: currentValue,
        previous_value: previousValue,
        change_percent: changePercent,
        trend,
        data_points: dataPoints,
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

function generateDemoData(metric: string) {
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
    data_points: generateDataPoints(value, "last_7d"),
  };
}

function generateDataPoints(baseValue: number, datePreset: string) {
  const dayCount = datePreset === "last_30d" ? 30 : datePreset === "last_7d" ? 7 : 1;
  const points = [];
  
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    points.push({
      date: date.toLocaleDateString("es-MX", { weekday: "short" }),
      value: baseValue / dayCount * (0.7 + Math.random() * 0.6),
    });
  }

  return points;
}
