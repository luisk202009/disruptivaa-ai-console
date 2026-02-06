import { useProjectGoals, GOAL_METRIC_LABELS, formatGoalValue } from "@/hooks/useProjectGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProjectHealthCardProps {
  projectId: string;
  projectColor: string;
}

type HealthStatus = {
  status: "healthy" | "warning" | "critical" | "neutral";
  label: string;
  emoji: string;
};

// Simulated current values - will be replaced with real data from Meta/Google
const getSimulatedCurrentValue = (metricKey: string): number => {
  const simulatedValues: Record<string, number> = {
    cpa: 8.5,      // Lower is better
    roas: 3.2,     // Higher is better
    ctr: 2.1,      // Higher is better
    cpc: 0.45,     // Lower is better
    spend: 4500,   // Actual spend
    conversions: 520, // Higher is better
  };
  return simulatedValues[metricKey] || 0;
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

const calculateOverallHealth = (
  goals: Array<{ metric_key: string; target_value: number }>
): HealthStatus => {
  if (goals.length === 0) {
    return { status: "neutral", label: "Sin metas", emoji: "📊" };
  }

  const results = goals.map((goal) => {
    const current = getSimulatedCurrentValue(goal.metric_key);
    const { isOnTrack } = calculateProgress(goal.metric_key, goal.target_value, current);
    return isOnTrack;
  });

  const successCount = results.filter(Boolean).length;
  const ratio = successCount / goals.length;

  if (ratio >= 0.7) return { status: "healthy", label: "Saludable", emoji: "✅" };
  if (ratio >= 0.4) return { status: "warning", label: "Atención", emoji: "⚠️" };
  return { status: "critical", label: "Crítico", emoji: "❌" };
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

export const ProjectHealthCard = ({ projectId, projectColor }: ProjectHealthCardProps) => {
  const { goals, loading } = useProjectGoals({ projectId });

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

  const healthStatus = calculateOverallHealth(goals);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity size={16} strokeWidth={1.5} className="text-muted-foreground" />
          Estado del Proyecto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Estado General</span>
          <Badge className={`${getStatusColor(healthStatus.status)} border`}>
            {healthStatus.emoji} {healthStatus.label}
          </Badge>
        </div>

        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Define metas para ver el estado de salud del proyecto.
          </p>
        ) : (
          <>
            {/* Individual Goal Progress */}
            <div className="space-y-3 pt-2">
              {goals.map((goal) => {
                const currentValue = getSimulatedCurrentValue(goal.metric_key);
                const { progress, isOnTrack } = calculateProgress(
                  goal.metric_key,
                  goal.target_value,
                  currentValue
                );
                const lowerIsBetter = isLowerBetter(goal.metric_key);

                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {GOAL_METRIC_LABELS[goal.metric_key]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {formatGoalValue({ ...goal, target_value: currentValue })}
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
                      <span>Meta: {formatGoalValue(goal)}</span>
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
                {goals.filter((goal) => {
                  const current = getSimulatedCurrentValue(goal.metric_key);
                  return calculateProgress(goal.metric_key, goal.target_value, current).isOnTrack;
                }).length} de {goals.length} metas cumplidas
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
