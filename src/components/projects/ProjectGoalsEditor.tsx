import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Target, Plus, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useProjectGoals,
  ProjectGoal,
  GoalMetricKey,
  GoalPeriod,
  GOAL_METRIC_LABELS,
  GOAL_PERIOD_LABELS,
  formatGoalValue,
} from "@/hooks/useProjectGoals";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProjectGoalsEditorProps {
  projectId: string;
  projectName: string;
  trigger?: React.ReactNode;
}

const AVAILABLE_METRICS: GoalMetricKey[] = ['cpa', 'roas', 'ctr', 'cpc', 'spend', 'conversions'];
const AVAILABLE_PERIODS: GoalPeriod[] = ['daily', 'weekly', 'monthly'];

export const ProjectGoalsEditor = ({ projectId, projectName, trigger }: ProjectGoalsEditorProps) => {
  const { t } = useTranslation();
  const { goals, loading, upsertGoal, deleteGoal } = useProjectGoals({ projectId });
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newMetric, setNewMetric] = useState<GoalMetricKey | "">("");
  const [newValue, setNewValue] = useState("");
  const [newPeriod, setNewPeriod] = useState<GoalPeriod>("monthly");
  const [newCurrency, setNewCurrency] = useState("USD");

  const availableMetrics = AVAILABLE_METRICS.filter((m) => !goals.some((g) => g.metric_key === m));

  const handleAddGoal = async () => {
    if (!newMetric || !newValue) return;
    setSavingId("new");
    const result = await upsertGoal({
      project_id: projectId, metric_key: newMetric,
      target_value: parseFloat(newValue), currency: newCurrency, period: newPeriod,
    });
    if (result) {
      toast({ title: t("projects.goalSaved"), description: t("projects.goalSavedDesc", { metric: GOAL_METRIC_LABELS[newMetric] }) });
      setNewMetric(""); setNewValue(""); setNewPeriod("monthly"); setIsAdding(false);
    } else {
      toast({ title: t("common.error"), description: t("projects.goalError"), variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleDeleteGoal = async (goal: ProjectGoal) => {
    setDeletingId(goal.id);
    const success = await deleteGoal(goal.id);
    if (success) {
      toast({ title: t("projects.goalDeleted"), description: t("projects.goalDeletedDesc", { metric: GOAL_METRIC_LABELS[goal.metric_key] }) });
    } else {
      toast({ title: t("common.error"), description: t("projects.goalDeleteError"), variant: "destructive" });
    }
    setDeletingId(null);
  };

  const getInputPlaceholder = (metric: GoalMetricKey | ""): string => {
    switch (metric) {
      case 'cpa': case 'cpc': return "15.00";
      case 'roas': return "3.5";
      case 'ctr': return "2.5";
      case 'spend': return "5000";
      case 'conversions': return "100";
      default: return "0";
    }
  };

  const getInputPrefix = (metric: GoalMetricKey | ""): string => {
    switch (metric) { case 'cpa': case 'cpc': case 'spend': return "$"; default: return ""; }
  };

  const getInputSuffix = (metric: GoalMetricKey | ""): string => {
    switch (metric) { case 'roas': return "x"; case 'ctr': return "%"; default: return ""; }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Target size={16} />
            {t("projectDetail.goals")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target size={20} className="text-primary" />
            {t("projects.projectGoals")}
          </DialogTitle>
          <DialogDescription dangerouslySetInnerHTML={{ __html: t("projects.projectGoalsDesc", { name: projectName }) }} />
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {goals.length > 0 && (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{GOAL_METRIC_LABELS[goal.metric_key]}</p>
                        <p className="text-muted-foreground text-sm">{formatGoalValue(goal)} • {GOAL_PERIOD_LABELS[goal.period]}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteGoal(goal)} disabled={deletingId === goal.id}>
                        {deletingId === goal.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {isAdding ? (
                <div className="space-y-4 p-4 rounded-lg border border-dashed">
                  <div className="space-y-2">
                    <Label>{t("projects.goalMetric")}</Label>
                    <Select value={newMetric} onValueChange={(v) => setNewMetric(v as GoalMetricKey)}>
                      <SelectTrigger><SelectValue placeholder={t("projects.selectMetric")} /></SelectTrigger>
                      <SelectContent>
                        {availableMetrics.map((metric) => (
                          <SelectItem key={metric} value={metric}>{GOAL_METRIC_LABELS[metric]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("projects.goalValue")}</Label>
                      <div className="relative">
                        {getInputPrefix(newMetric) && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getInputPrefix(newMetric)}</span>
                        )}
                        <Input type="number" step="0.01" placeholder={getInputPlaceholder(newMetric)} value={newValue} onChange={(e) => setNewValue(e.target.value)}
                          className={cn(getInputPrefix(newMetric) && "pl-7", getInputSuffix(newMetric) && "pr-7")} />
                        {getInputSuffix(newMetric) && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getInputSuffix(newMetric)}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("projects.goalPeriod")}</Label>
                      <Select value={newPeriod} onValueChange={(v) => setNewPeriod(v as GoalPeriod)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_PERIODS.map((period) => (
                            <SelectItem key={period} value={period}>{GOAL_PERIOD_LABELS[period]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setIsAdding(false); setNewMetric(""); setNewValue(""); }}>
                      {t("common.cancel")}
                    </Button>
                    <Button className="flex-1" onClick={handleAddGoal} disabled={!newMetric || !newValue || savingId === "new"}>
                      {savingId === "new" ? <Loader2 size={16} className="animate-spin" /> : t("common.save")}
                    </Button>
                  </div>
                </div>
              ) : availableMetrics.length > 0 ? (
                <Button variant="outline" className="w-full border-dashed gap-2" onClick={() => setIsAdding(true)}>
                  <Plus size={16} />
                  {t("common.addGoal")}
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">{t("projects.allMetricsDefined")}</p>
              )}

              {goals.length === 0 && !isAdding && (
                <p className="text-center text-sm text-muted-foreground">{t("projects.noGoalsDefined")}</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
