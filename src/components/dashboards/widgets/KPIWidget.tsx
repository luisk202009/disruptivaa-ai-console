import { TrendingUp, TrendingDown, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { Widget } from "@/hooks/useWidgets";
import { MetricData, useMetaMetrics } from "@/hooks/useMetaMetrics";
import { cn } from "@/lib/utils";

interface KPIWidgetProps {
  widget: Widget;
  data: MetricData;
}

export const KPIWidget = ({ widget, data }: KPIWidgetProps) => {
  const { formatValue } = useMetaMetrics();
  const { metric, goal, currency: configCurrency } = widget.metric_config;
  const currency = data.currency || configCurrency || "USD";

  const formattedValue = formatValue(data.value, metric, currency);
  const changePercent = data.change_percent ?? 0;
  const trend = data.trend ?? (changePercent > 0 ? "up" : changePercent < 0 ? "down" : "neutral");
  
  const hasGoal = goal !== undefined && goal > 0;
  const goalProgress = hasGoal ? (data.value / goal) * 100 : 0;
  const goalMet = hasGoal && data.value >= goal;
  const hasComparison = data.previous_value !== undefined;

  return (
    <div className="flex-1 flex flex-col justify-center">
      {/* Main Value */}
      <div className="text-center mb-2">
        <p className="text-3xl font-bold text-foreground">
          {formattedValue}
        </p>
      </div>

      {/* Change Indicator */}
      {hasComparison && changePercent !== 0 && (
        <div className="flex items-center justify-center gap-1 mb-3">
          {trend === "up" ? (
            <TrendingUp size={16} className="text-green-500" />
          ) : trend === "down" ? (
            <TrendingDown size={16} className="text-red-500" />
          ) : null}
          <span
            className={cn(
              "text-sm font-medium",
              trend === "up" && "text-green-500",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-muted-foreground"
            )}
          >
            {changePercent > 0 ? "+" : ""}
            {changePercent.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs período anterior</span>
        </div>
      )}

      {/* Goal Progress */}
      {hasGoal && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Target size={12} />
              Meta: {formatValue(goal, metric, currency)}
            </span>
            <span className={cn(
              "flex items-center gap-1",
              goalMet ? "text-green-500" : "text-amber-500"
            )}>
              {goalMet ? (
                <>
                  <CheckCircle2 size={12} />
                  ¡Logrado!
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  {goalProgress.toFixed(0)}%
                </>
              )}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                goalMet ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(goalProgress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
