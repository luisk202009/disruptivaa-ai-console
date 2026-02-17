import { Widget } from "@/hooks/useWidgets";
import { MetricData } from "@/hooks/useMetaMetrics";
import { ProjectGoal, formatGoalValue, GOAL_PERIOD_LABELS } from "@/hooks/useProjectGoals";
import { cn } from "@/lib/utils";

interface GoalTrackerWidgetProps {
  widget: Widget;
  data: MetricData;
  goal: ProjectGoal;
}

export const GoalTrackerWidget = ({ widget, data, goal }: GoalTrackerWidgetProps) => {
  // For metrics where lower is better (CPA, CPC), we invert the progress calculation
  const isInverseMetric = ['cpa', 'cpc'].includes(goal.metric_key);
  
  // Calculate raw progress
  const rawProgress = (data.value / goal.target_value) * 100;
  
  // For inverse metrics, 100% means we're at or below target
  // For normal metrics, 100% means we're at or above target
  const displayProgress = isInverseMetric
    ? Math.min((goal.target_value / data.value) * 100, 100)
    : Math.min(rawProgress, 100);
  
  // Determine status
  const getStatus = (): { color: string; label: string; emoji: string } => {
    if (isInverseMetric) {
      // Lower is better
      if (data.value <= goal.target_value) {
        return { color: "#22c55e", label: "Cumplido", emoji: "✅" };
      } else if (data.value <= goal.target_value * 1.1) {
        return { color: "#eab308", label: "Cerca", emoji: "⚠️" };
      }
      return { color: "#ef4444", label: "Por encima", emoji: "❌" };
    } else {
      // Higher is better
      if (data.value >= goal.target_value) {
        return { color: "#22c55e", label: "Cumplido", emoji: "✅" };
      } else if (data.value >= goal.target_value * 0.9) {
        return { color: "#eab308", label: "Cerca", emoji: "⚠️" };
      }
      return { color: "#ef4444", label: "Por debajo", emoji: "❌" };
    }
  };

  const status = getStatus();
  
  // SVG circle calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  // Format current value using dynamic currency
  const goalCurrency = goal.currency || "USD";
  
  const formatCurrencyValue = (value: number, cur: string): string => {
    const noDecimals = ["COP", "CLP", "JPY", "KRW"];
    const locale = cur === "COP" ? "es-CO" : cur === "EUR" ? "es-ES" : cur === "MXN" ? "es-MX" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: noDecimals.includes(cur) ? 0 : 2,
      maximumFractionDigits: noDecimals.includes(cur) ? 0 : 2,
    }).format(value);
  };

  const formatValue = (value: number): string => {
    switch (goal.metric_key) {
      case 'cpa':
      case 'cpc':
      case 'spend':
        return formatCurrencyValue(value, goalCurrency);
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-2">
      {/* Progress Ring */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg 
          className="w-full h-full -rotate-90"
          viewBox="0 0 120 120"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            className="text-muted/20"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={status.color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p 
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: status.color }}
          >
            {displayProgress.toFixed(0)}%
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {formatValue(data.value)}
          </p>
        </div>
      </div>

      {/* Status and Goal Info */}
      <div className="mt-4 text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">{status.emoji}</span>
          <span 
            className="text-sm font-medium"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Meta: {formatGoalValue(goal)}
        </p>
        <p className="text-xs text-muted-foreground">
          {GOAL_PERIOD_LABELS[goal.period]}
        </p>
      </div>
    </div>
  );
};
