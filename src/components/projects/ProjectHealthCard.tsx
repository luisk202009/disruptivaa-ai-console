import { GOAL_METRIC_LABELS, formatGoalValue, type ProjectGoal } from "@/hooks/useProjectGoals";
import type { GoalMetricData } from "@/hooks/useGoalMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, TrendingDown, RefreshCw, FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProjectHealthCardProps {
  projectId: string;
  projectColor: string;
  goals: ProjectGoal[];
  metricsData: GoalMetricData[];
  metricsLoading: boolean;
  refreshing: boolean;
  isDemo: boolean;
  onRefresh: () => Promise<void>;
}

type HealthStatus = {
  status: "healthy" | "warning" | "critical" | "neutral";
  label: string;
  emoji: string;
};

// Determine if a metric is "lower is better" type
const isLowerBetter = (metricKey: string): boolean => {
  return ["cpa", "cpc", "spend"].includes(metricKey);
};

// Calculate progress percentage for a goal
const calculateProgress = (
  metricKey: string,
  targetValue: number,
  currentValue: number
): { progress: number; isOnTrack: boolean } => {
  if (isLowerBetter(metricKey)) {
    // For CPA/CPC: being under target is good
    const progress = Math.min(100, (targetValue / currentValue) * 100);
    return { progress, isOnTrack: currentValue <= targetValue };
  } else {
    // For ROAS/CTR/Conversions: being over target is good
    const progress = Math.min(100, (currentValue / targetValue) * 100);
    return { progress, isOnTrack: currentValue >= targetValue };
  }
};

const getStatusColor = (status: HealthStatus["status"]): string => {
  switch (status) {
    case "healthy":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "warning":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "critical":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getProgressColor = (isOnTrack: boolean): string => {
  return isOnTrack ? "bg-green-500" : "bg-yellow-500";
};

export const ProjectHealthCard = ({ 
  projectId, 
  projectColor,
  goals,
  metricsData,
  metricsLoading,
  refreshing,
  isDemo,
  onRefresh,
}: ProjectHealthCardProps) => {
  const { t } = useTranslation();

  const loading = metricsLoading;

  // Calculate overall health from real metrics data
  const calculateOverallHealth = (): HealthStatus => {
    if (goals.length === 0) {
      return { status: "neutral", label: t("projectHealth.neutral"), emoji: "📊" };
    }

    const results = metricsData.map((metricData) => {
      const { isOnTrack } = calculateProgress(
        metricData.goal.metric_key,
        metricData.goal.target_value,
        metricData.currentValue
      );
      return isOnTrack;
    });

    const successCount = results.filter(Boolean).length;
    const ratio = successCount / goals.length;

    if (ratio >= 0.7) return { status: "healthy", label: t("projectHealth.healthy"), emoji: "✅" };
    if (ratio >= 0.4) return { status: "warning", label: t("projectHealth.warning"), emoji: "⚠️" };
    return { status: "critical", label: t("projectHealth.critical"), emoji: "❌" };
  };

  const handleRefresh = async () => {
    await onRefresh();
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthStatus = calculateOverallHealth();

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity size={16} strokeWidth={1.5} className="text-muted-foreground" />
            {t("projectHealth.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isDemo && (
              <Badge variant="outline" className="text-xs gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
                <FlaskConical size={10} />
                {t("projectHealth.demoData")}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("projectHealth.overallStatus")}</span>
          <Badge className={`${getStatusColor(healthStatus.status)} border`}>
            {healthStatus.emoji} {healthStatus.label}
          </Badge>
        </div>

        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("projectHealth.defineGoals")}
          </p>
        ) : (
          <>
            {/* Individual Goal Progress */}
            <div className="space-y-3 pt-2">
              {metricsData.map((metricData) => {
                const { progress, isOnTrack } = calculateProgress(
                  metricData.goal.metric_key,
                  metricData.goal.target_value,
                  metricData.currentValue
                );
                const lowerIsBetter = isLowerBetter(metricData.goal.metric_key);

                return (
                  <div key={metricData.goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {GOAL_METRIC_LABELS[metricData.goal.metric_key]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {formatGoalValue({ ...metricData.goal, target_value: metricData.currentValue } as ProjectGoal)}
                        </span>
                        {isOnTrack ? (
                          <TrendingUp size={14} className="text-green-500" />
                        ) : lowerIsBetter ? (
                          <TrendingUp size={14} className="text-red-500" />
                        ) : (
                          <TrendingDown size={14} className="text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={progress} className="h-1.5 bg-muted" />
                      <div
                        className={`absolute inset-0 h-1.5 rounded-full transition-all ${getProgressColor(isOnTrack)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("projectHealth.goal")}: {formatGoalValue(metricData.goal as ProjectGoal)}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div 
              className="pt-3 border-t border-border text-center"
              style={{ borderTopColor: projectColor }}
            >
              <p className="text-xs text-muted-foreground">
                {t("projectHealth.goalsAchieved", {
                  count: metricsData.filter((m) => {
                    const { isOnTrack } = calculateProgress(
                      m.goal.metric_key,
                      m.goal.target_value,
                      m.currentValue
                    );
                    return isOnTrack;
                  }).length,
                  total: goals.length
                })}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};