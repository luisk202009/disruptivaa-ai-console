import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Widget } from "@/hooks/useWidgets";
import { METRIC_LABELS, DATE_PRESET_LABELS } from "@/hooks/useMetaMetrics";
import { Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: Widget[];
  dashboardName: string;
}

export const ExportReportDialog = ({
  open,
  onOpenChange,
  widgets,
  dashboardName,
}: ExportReportDialogProps) => {
  const [copied, setCopied] = useState(false);

  const generateReport = (): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let report = `📊 INFORME: ${dashboardName}\n`;
    report += `📅 Generado: ${dateStr} a las ${timeStr}\n`;
    report += `═══════════════════════════════════════\n\n`;

    // Group widgets by type
    const kpiWidgets = widgets.filter((w) => w.type === "kpi");
    const chartWidgets = widgets.filter((w) =>
      ["line", "bar", "area", "pie"].includes(w.type)
    );
    const goalWidgets = widgets.filter((w) => w.type === "goal_tracker");

    if (kpiWidgets.length > 0) {
      report += `## 📈 KPIs Principales\n\n`;
      kpiWidgets.forEach((widget) => {
        const metricLabel = METRIC_LABELS[widget.metric_config.metric] || widget.metric_config.metric;
        const dateLabel = DATE_PRESET_LABELS[widget.metric_config.date_preset] || widget.metric_config.date_preset;
        const accountName = widget.metric_config.account_name || "Sin cuenta asignada";
        
        report += `• **${widget.title}**\n`;
        report += `  - Métrica: ${metricLabel}\n`;
        report += `  - Período: ${dateLabel}\n`;
        report += `  - Cuenta: ${accountName}\n\n`;
      });
    }

    if (chartWidgets.length > 0) {
      report += `## 📊 Gráficos\n\n`;
      chartWidgets.forEach((widget) => {
        const metricLabel = METRIC_LABELS[widget.metric_config.metric] || widget.metric_config.metric;
        const dateLabel = DATE_PRESET_LABELS[widget.metric_config.date_preset] || widget.metric_config.date_preset;
        const typeLabels: Record<string, string> = {
          line: "Línea",
          bar: "Barras",
          area: "Área",
          pie: "Circular",
        };
        
        report += `• **${widget.title}** (${typeLabels[widget.type] || widget.type})\n`;
        report += `  - Métrica: ${metricLabel}\n`;
        report += `  - Período: ${dateLabel}\n\n`;
      });
    }

    if (goalWidgets.length > 0) {
      report += `## 🎯 Seguimiento de Objetivos\n\n`;
      goalWidgets.forEach((widget) => {
        report += `• **${widget.title}**\n`;
        if (widget.metric_config.goal) {
          report += `  - Objetivo: ${widget.metric_config.goal}\n`;
        }
        report += `\n`;
      });
    }

    report += `───────────────────────────────────────\n`;
    report += `Total de widgets: ${widgets.length}\n`;
    report += `Plataformas: Meta Ads, Google Ads, TikTok Ads\n`;
    report += `\n📌 Generado por Disruptivaa Dashboard`;

    return report;
  };

  const reportText = generateReport();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success("Informe copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error al copiar el informe");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-${dashboardName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Informe descargado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📊 Exportar Informe
          </DialogTitle>
          <DialogDescription>
            Copia o descarga un resumen de tu panel para compartir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <Textarea
            value={reportText}
            readOnly
            className="h-[400px] resize-none font-mono text-sm"
          />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCopy}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Copiado" : "Copiar al Portapapeles"}
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleDownload}
          >
            <Download size={18} />
            Descargar .txt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
