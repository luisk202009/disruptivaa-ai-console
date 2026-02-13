import { useMemo } from "react";
import { useProjects } from "./useProjects";
import { useProjectGoals, GoalMetricKey } from "./useProjectGoals";
import { useGoalMetrics } from "./useGoalMetrics";

export interface SmartAlert {
  id: string;
  metricKey: GoalMetricKey;
  level: "critical" | "warning";
  currentValue: number;
  targetValue: number;
  deviationPercent: number;
  platform: string;
  currency: string;
}

export interface UseSmartAlertsResult {
  alerts: SmartAlert[];
  loading: boolean;
  isDemo: boolean;
  allClear: boolean;
  hasGoals: boolean;
}

// Metrics where higher = worse (cost metrics)
const INVERSE_METRICS: GoalMetricKey[] = ["cpa", "cpc", "spend"];
// Metrics where lower = worse (performance metrics)
const DIRECT_METRICS: GoalMetricKey[] = ["roas", "ctr", "conversions"];

export const useSmartAlerts = (): UseSmartAlertsResult => {
  const { projects, loading: projectsLoading } = useProjects();
  
  // Use the first project that has goals
  const firstProject = projects[0];
  const { goals, loading: goalsLoading } = useProjectGoals({ 
    projectId: firstProject?.id 
  });
  
  const { metricsData, loading: metricsLoading, isDemo } = useGoalMetrics(goals);

  const alerts = useMemo<SmartAlert[]>(() => {
    if (goals.length === 0 || metricsData.length === 0) return [];

    const result: SmartAlert[] = [];

    for (const metric of metricsData) {
      const { goal, currentValue } = metric;
      const targetValue = goal.target_value;
      
      if (!targetValue || targetValue === 0 || isNaN(currentValue)) continue;

      const rawDeviation = (currentValue - targetValue) / targetValue;
      const isInverse = INVERSE_METRICS.includes(goal.metric_key as GoalMetricKey);
      
      // For inverse metrics: positive deviation = bad (cost went up)
      // For direct metrics: negative deviation = bad (performance went down)
      const isBad = isInverse ? rawDeviation > 0 : rawDeviation < 0;
      
      if (!isBad) continue;
      
      const absDeviation = Math.abs(rawDeviation);
      
      let level: "critical" | "warning" | null = null;
      if (absDeviation > 0.25) {
        level = "critical";
      } else if (absDeviation > 0.15) {
        level = "warning";
      }
      
      if (!level) continue;

      result.push({
        id: `${goal.metric_key}-${goal.id}`,
        metricKey: goal.metric_key as GoalMetricKey,
        level,
        currentValue: Number(currentValue.toFixed(2)),
        targetValue,
        deviationPercent: Number((absDeviation * 100).toFixed(1)),
        platform: "combined",
        currency: goal.currency || "USD",
      });
    }

    // Sort: critical first, then by deviation
    return result.sort((a, b) => {
      if (a.level !== b.level) return a.level === "critical" ? -1 : 1;
      return b.deviationPercent - a.deviationPercent;
    });
  }, [goals, metricsData]);

  return {
    alerts,
    loading: projectsLoading || goalsLoading || metricsLoading,
    isDemo,
    allClear: goals.length > 0 && alerts.length === 0,
    hasGoals: goals.length > 0,
  };
};
