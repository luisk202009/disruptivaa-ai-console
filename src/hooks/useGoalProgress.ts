import { useMemo } from "react";
import { ProjectGoal } from "./useProjectGoals";
import { MetricData } from "./useMetaMetrics";

export type GoalStatus = 'success' | 'warning' | 'danger';

export interface GoalProgress {
  goal: ProjectGoal;
  currentValue: number;
  percentProgress: number;
  difference: number;
  differencePercent: number;
  status: GoalStatus;
  statusLabel: string;
  statusEmoji: string;
}

/**
 * Calculate goal progress from real metric data
 * Handles inverse metrics (CPA, CPC) where lower is better
 */
export const useGoalProgress = (
  goal: ProjectGoal | null,
  data: MetricData | null
): GoalProgress | null => {
  return useMemo(() => {
    if (!goal || !data) return null;

    const currentValue = data.value;
    const targetValue = goal.target_value;
    
    // Inverse metrics: lower is better (CPA, CPC)
    const isInverseMetric = ['cpa', 'cpc'].includes(goal.metric_key);
    
    let percentProgress: number;
    let status: GoalStatus;
    let statusLabel: string;
    let statusEmoji: string;
    let difference: number;
    let differencePercent: number;

    if (isInverseMetric) {
      // For inverse metrics: target / actual (lower actual = higher progress)
      percentProgress = Math.min((targetValue / currentValue) * 100, 100);
      difference = currentValue - targetValue;
      differencePercent = ((currentValue - targetValue) / targetValue) * 100;
      
      if (currentValue <= targetValue) {
        status = 'success';
        statusLabel = 'Cumplido';
        statusEmoji = '✅';
      } else if (currentValue <= targetValue * 1.1) {
        status = 'warning';
        statusLabel = 'Cerca';
        statusEmoji = '⚠️';
      } else {
        status = 'danger';
        statusLabel = 'Por encima';
        statusEmoji = '❌';
      }
    } else {
      // For normal metrics: actual / target (higher actual = higher progress)
      percentProgress = Math.min((currentValue / targetValue) * 100, 100);
      difference = currentValue - targetValue;
      differencePercent = ((currentValue - targetValue) / targetValue) * 100;
      
      if (currentValue >= targetValue) {
        status = 'success';
        statusLabel = 'Cumplido';
        statusEmoji = '✅';
      } else if (currentValue >= targetValue * 0.9) {
        status = 'warning';
        statusLabel = 'Cerca';
        statusEmoji = '⚠️';
      } else {
        status = 'danger';
        statusLabel = 'Por debajo';
        statusEmoji = '❌';
      }
    }

    return {
      goal,
      currentValue,
      percentProgress,
      difference,
      differencePercent,
      status,
      statusLabel,
      statusEmoji,
    };
  }, [goal, data]);
};

/**
 * Get status color based on goal status
 */
export const getStatusColor = (status: GoalStatus): string => {
  switch (status) {
    case 'success':
      return 'hsl(142 76% 36%)'; // green-600
    case 'warning':
      return 'hsl(45 93% 47%)'; // yellow-500
    case 'danger':
      return 'hsl(0 84% 60%)'; // red-500
    default:
      return 'hsl(240 4% 46%)'; // gray
  }
};

/**
 * Format metric value for display based on metric type
 */
export const formatMetricValue = (value: number, metricKey: string, currency = 'USD'): string => {
  switch (metricKey) {
    case 'cpa':
    case 'cpc':
    case 'spend':
      return `${currency === 'USD' ? '$' : currency}${value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    case 'roas':
      return `${value.toFixed(2)}x`;
    case 'ctr':
      return `${value.toFixed(2)}%`;
    case 'conversions':
      return value.toLocaleString();
    default:
      return String(value);
  }
};
