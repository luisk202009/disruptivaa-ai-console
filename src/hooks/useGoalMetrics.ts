import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";

type ProjectGoal = Tables<"project_goals">;

export type GoalMetricKey = "cpa" | "roas" | "ctr" | "cpc" | "spend" | "conversions";

export interface GoalMetricData {
  goal: ProjectGoal;
  currentValue: number;
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;
}

export interface UseGoalMetricsResult {
  metricsData: GoalMetricData[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  isDemo: boolean;
}

// Map goal metric keys to API metric names
const GOAL_TO_API_METRIC: Record<GoalMetricKey, string> = {
  cpa: "cpa",
  roas: "roas",
  ctr: "ctr",
  cpc: "cpc",
  spend: "spend",
  conversions: "conversions",
};

// Simulated values when no real data is available
const getSimulatedValue = (metricKey: string): number => {
  const simulatedValues: Record<string, number> = {
    cpa: 8.5 + Math.random() * 4,
    roas: 2.5 + Math.random() * 2,
    ctr: 1.5 + Math.random() * 2,
    cpc: 0.35 + Math.random() * 0.4,
    spend: 3500 + Math.random() * 2000,
    conversions: 400 + Math.random() * 300,
  };
  return Number((simulatedValues[metricKey] || 0).toFixed(2));
};

export const useGoalMetrics = (
  goals: ProjectGoal[],
  accountId?: string,
  platform: "meta_ads" | "google_ads" = "meta_ads"
): UseGoalMetricsResult => {
  const { user } = useAuth();
  const [metricsData, setMetricsData] = useState<GoalMetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (!user || goals.length === 0) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Return simulated data if no session
        const simulatedData = goals.map((goal) => ({
          goal,
          currentValue: getSimulatedValue(goal.metric_key),
          isLoading: false,
          isDemo: true,
          error: null,
        }));
        setMetricsData(simulatedData);
        setIsDemo(true);
        return;
      }

      // Check if user has any integrations
      const { data: integration } = await supabase
        .from("user_integrations")
        .select("account_ids, status")
        .eq("user_id", user.id)
        .eq("platform", platform)
        .eq("status", "connected")
        .maybeSingle();

      const hasIntegration = integration?.account_ids?.length && integration.account_ids.length > 0;

      if (!hasIntegration) {
        // Return simulated data if no integration
        const simulatedData = goals.map((goal) => ({
          goal,
          currentValue: getSimulatedValue(goal.metric_key),
          isLoading: false,
          isDemo: true,
          error: null,
        }));
        setMetricsData(simulatedData);
        setIsDemo(true);
        return;
      }

      // Fetch real metrics for each goal
      const functionName = platform === "meta_ads" ? "fetch-meta-metrics" : "fetch-google-ads-metrics";
      const targetAccountId = accountId || integration.account_ids[0];

      const results = await Promise.all(
        goals.map(async (goal) => {
          try {
            const response = await supabase.functions.invoke(functionName, {
              body: {
                metric: GOAL_TO_API_METRIC[goal.metric_key as GoalMetricKey] || goal.metric_key,
                date_preset: goal.period === "monthly" ? "this_month" : "last_7d",
                account_id: targetAccountId,
                comparison: false,
              },
            });

            if (response.error) {
              return {
                goal,
                currentValue: getSimulatedValue(goal.metric_key),
                isLoading: false,
                isDemo: true,
                error: response.error.message,
              };
            }

            const isDataDemo = response.data?.is_demo === true;
            return {
              goal,
              currentValue: response.data?.value ?? getSimulatedValue(goal.metric_key),
              isLoading: false,
              isDemo: isDataDemo,
              error: null,
            };
          } catch (error) {
            return {
              goal,
              currentValue: getSimulatedValue(goal.metric_key),
              isLoading: false,
              isDemo: true,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        })
      );

      setMetricsData(results);
      setIsDemo(results.every((r) => r.isDemo));
    } catch (error) {
      console.error("Error fetching goal metrics:", error);
      // Fallback to simulated data on error
      const simulatedData = goals.map((goal) => ({
        goal,
        currentValue: getSimulatedValue(goal.metric_key),
        isLoading: false,
        isDemo: true,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      setMetricsData(simulatedData);
      setIsDemo(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, goals, accountId, platform]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refresh = useCallback(async () => {
    await fetchMetrics(true);
  }, [fetchMetrics]);

  return {
    metricsData,
    loading,
    refreshing,
    refresh,
    isDemo,
  };
};