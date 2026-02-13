import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Printer, Sparkles, Loader2, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GOAL_METRIC_LABELS, formatGoalValue, type ProjectGoal } from "@/hooks/useProjectGoals";
import type { GoalMetricData } from "@/hooks/useGoalMetrics";

interface ProjectExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  goals: ProjectGoal[];
  metricsData: GoalMetricData[];
  isDemo: boolean;
}

const isLowerBetter = (key: string) => ["cpa", "cpc", "spend"].includes(key);

const getStatusEmoji = (metricKey: string, target: number, current: number) => {
  const onTrack = isLowerBetter(metricKey) ? current <= target : current >= target;
  if (onTrack) return "✅";
  const ratio = isLowerBetter(metricKey) ? target / current : current / target;
  return ratio >= 0.7 ? "⚠️" : "❌";
};

export const ProjectExportDialog = ({
  open,
  onOpenChange,
  projectName,
  goals,
  metricsData,
  isDemo,
}: ProjectExportDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [includeGoals, setIncludeGoals] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeAI, setIncludeAI] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  const generateAISummary = async () => {
    setGeneratingAI(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const goalsData = metricsData.map((m) => ({
        metric_key: m.goal.metric_key,
        target_value: m.goal.target_value,
        current_value: m.currentValue,
        is_on_track: isLowerBetter(m.goal.metric_key)
          ? m.currentValue <= m.goal.target_value
          : m.currentValue >= m.goal.target_value,
      }));

      const res = await supabase.functions.invoke("disruptivaa-agent", {
        body: { action: "executive-summary", goalsData },
      });

      if (res.error) throw res.error;
      setAiSummary(res.data?.summary || "");
      setIncludeAI(true);
    } catch (err) {
      console.error("AI summary error:", err);
      toast({ title: t("projectExport.summaryError"), variant: "destructive" });
    } finally {
      setGeneratingAI(false);
    }
  };

  const report = useMemo(() => {
    const now = new Date();
    const lines: string[] = [];

    lines.push(`# ${projectName}`);
    lines.push(`📅 ${now.toLocaleDateString()} — ${now.toLocaleTimeString()}`);
    lines.push("");

    if (isDemo) {
      lines.push(`> ⚠️ ${t("projectExport.demoDisclaimer")}`);
      lines.push("");
    }

    if (includeGoals && goals.length > 0) {
      lines.push(`## ${t("projectExport.goalsSection")}`);
      lines.push("");
      lines.push(`| ${t("projectHealth.goal")} | Target | Actual | Status |`);
      lines.push("|---|---|---|---|");
      metricsData.forEach((m) => {
        const emoji = getStatusEmoji(m.goal.metric_key, m.goal.target_value, m.currentValue);
        const label = GOAL_METRIC_LABELS[m.goal.metric_key as keyof typeof GOAL_METRIC_LABELS];
        const target = formatGoalValue(m.goal as ProjectGoal);
        const current = formatGoalValue({ ...m.goal, target_value: m.currentValue } as ProjectGoal);
        lines.push(`| ${label} | ${target} | ${current} | ${emoji} |`);
      });
      lines.push("");
    }

    if (includeMetrics && metricsData.length > 0) {
      lines.push(`## ${t("projectExport.metricsSection")}`);
      lines.push("");
      metricsData.forEach((m) => {
        const label = GOAL_METRIC_LABELS[m.goal.metric_key as keyof typeof GOAL_METRIC_LABELS];
        const current = formatGoalValue({ ...m.goal, target_value: m.currentValue } as ProjectGoal);
        const onTrack = isLowerBetter(m.goal.metric_key)
          ? m.currentValue <= m.goal.target_value
          : m.currentValue >= m.goal.target_value;
        lines.push(`- **${label}**: ${current} ${onTrack ? t("projectExport.achieved") : t("projectExport.notAchieved")}`);
      });
      lines.push("");
    }

    if (includeAI && aiSummary) {
      lines.push(`## ${t("projectExport.summarySection")}`);
      lines.push("");
      lines.push(aiSummary);
      lines.push("");
    }

    lines.push("---");
    lines.push("*Generado por Disruptivaa*");

    return lines.join("\n");
  }, [includeGoals, includeMetrics, includeAI, aiSummary, goals, metricsData, isDemo, projectName, t]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      toast({ title: t("projectExport.copied") });
    } catch {
      toast({ title: t("projectExport.copyError"), variant: "destructive" });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "_")}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("projectExport.downloaded") });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family:system-ui;white-space:pre-wrap;max-width:800px;margin:2rem auto;">${report}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">{t("projectExport.title")}</DialogTitle>
          <DialogDescription className="text-sm">{t("projectExport.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={includeGoals} onCheckedChange={(v) => setIncludeGoals(!!v)} />
              <span className="text-sm">{t("projectExport.includeGoals")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={includeMetrics} onCheckedChange={(v) => setIncludeMetrics(!!v)} />
              <span className="text-sm">{t("projectExport.includeMetrics")}</span>
            </label>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={includeAI} onCheckedChange={(v) => setIncludeAI(!!v)} disabled={!aiSummary} />
                <span className="text-sm">{t("projectExport.includeAISummary")}</span>
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAISummary}
                disabled={generatingAI || metricsData.length === 0}
                className="gap-1.5 text-xs"
              >
                {generatingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {generatingAI ? t("projectExport.generatingSummary") : t("projectExport.generateSummary")}
              </Button>
            </div>
          </div>

          {isDemo && (
            <Badge variant="outline" className="gap-1 text-xs bg-destructive/10 text-destructive border-destructive/20">
              <FlaskConical size={10} />
              {t("projectExport.demoDisclaimer")}
            </Badge>
          )}

          {/* Preview */}
          <Textarea
            readOnly
            value={report}
            className="min-h-[200px] text-xs font-mono bg-muted/50 resize-none"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 flex-1">
            <Copy size={14} />
            {t("projectExport.copyMarkdown")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 flex-1">
            <Download size={14} />
            {t("projectExport.downloadTxt")}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
