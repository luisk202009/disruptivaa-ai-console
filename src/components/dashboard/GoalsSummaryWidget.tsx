import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Target, ArrowRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectGoals } from "@/hooks/useProjectGoals";
import { formatGoalValue } from "@/hooks/useProjectGoals";
import { cn } from "@/lib/utils";

const GoalsSummaryWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjects();
  const firstProject = projects[0];
  const { goals, loading: goalsLoading } = useProjectGoals({ projectId: firstProject?.id });

  const loading = projectsLoading || goalsLoading;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-card p-5 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  if (!firstProject) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">{t("dashboardWidgets.goalsTitle")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("dashboardWidgets.goalsEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">{t("dashboardWidgets.goalsTitle")}</h3>
        </div>
        <button
          onClick={() => navigate(`/project/${firstProject.id}`)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("dashboardWidgets.viewDetails")}
          <ArrowRight size={12} />
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{firstProject.name}</p>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dashboardWidgets.goalsEmpty")}</p>
      ) : (
        <div className="space-y-2">
          {goals.slice(0, 4).map((goal) => (
            <div key={goal.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground capitalize">{goal.metric_key.toUpperCase()}</span>
              <span className="text-foreground font-medium">{formatGoalValue(goal)}</span>
            </div>
          ))}
          {goals.length > 4 && (
            <p className="text-xs text-muted-foreground">{t("common.andMore", { count: goals.length - 4 })}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalsSummaryWidget;
