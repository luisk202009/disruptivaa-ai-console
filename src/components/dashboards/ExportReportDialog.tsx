import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Copy, Download, Check, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: Widget[];
  dashboardName: string;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 163, b: 255 };
};

const addFooter = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
  const dateStr = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Generado por Disruptivaa AI Console - ${dateStr}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
};

export const ExportReportDialog = ({
  open,
  onOpenChange,
  widgets,
  dashboardName,
}: ExportReportDialogProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { companyName, companyColor } = useCompanyBranding();

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

    const kpiWidgets = widgets.filter((w) => w.type === "kpi");
    const chartWidgets = widgets.filter((w) =>
      ["line", "bar", "area", "pie"].includes(w.type)
    );
    const goalWidgets = widgets.filter((w) => w.type === "goal_tracker");

    if (kpiWidgets.length > 0) {
      report += `## 📈 KPIs Principales\n\n`;
      kpiWidgets.forEach((widget) => {
        const metricLabel =
          METRIC_LABELS[widget.metric_config.metric] ||
          widget.metric_config.metric;
        const dateLabel =
          DATE_PRESET_LABELS[widget.metric_config.date_preset] ||
          widget.metric_config.date_preset;
        const accountName =
          widget.metric_config.account_name || "Sin cuenta asignada";

        report += `• **${widget.title}**\n`;
        report += `  - Métrica: ${metricLabel}\n`;
        report += `  - Período: ${dateLabel}\n`;
        report += `  - Cuenta: ${accountName}\n\n`;
      });
    }

    if (chartWidgets.length > 0) {
      report += `## 📊 Gráficos\n\n`;
      chartWidgets.forEach((widget) => {
        const metricLabel =
          METRIC_LABELS[widget.metric_config.metric] ||
          widget.metric_config.metric;
        const dateLabel =
          DATE_PRESET_LABELS[widget.metric_config.date_preset] ||
          widget.metric_config.date_preset;
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
      toast.success(t("exportReport.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t("exportReport.copyError"));
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const color = hexToRgb(companyColor);
      const margin = 15;
      let y = 20;

      // --- Header ---
      doc.setFontSize(22);
      doc.setTextColor(color.r, color.g, color.b);
      doc.text(companyName || dashboardName, margin, y);
      y += 8;

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(`Informe: ${dashboardName}  •  ${dateStr}`, margin, y);
      y += 4;

      // Decorative line
      doc.setDrawColor(color.r, color.g, color.b);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- KPIs Section ---
      const kpiWidgets = widgets.filter((w) => w.type === "kpi");
      if (kpiWidgets.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(color.r, color.g, color.b);
        doc.text("KPIs Principales", margin, y);
        y += 8;

        // Table header
        const colWidth = (pageWidth - margin * 2) / 4;
        doc.setFillColor(color.r, color.g, color.b);
        doc.rect(margin, y - 5, pageWidth - margin * 2, 8, "F");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("Widget", margin + 3, y);
        doc.text("Métrica", margin + colWidth + 3, y);
        doc.text("Período", margin + colWidth * 2 + 3, y);
        doc.text("Cuenta", margin + colWidth * 3 + 3, y);
        y += 6;

        // Table rows
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        kpiWidgets.forEach((widget) => {
          if (y > pageHeight - 25) {
            addFooter(doc, pageWidth, pageHeight);
            doc.addPage();
            y = 20;
          }
          const metricLabel = METRIC_LABELS[widget.metric_config.metric] || widget.metric_config.metric;
          const dateLabel = DATE_PRESET_LABELS[widget.metric_config.date_preset] || widget.metric_config.date_preset;
          const accountName = widget.metric_config.account_name || "—";

          doc.text(widget.title.substring(0, 30), margin + 3, y);
          doc.text(metricLabel.substring(0, 25), margin + colWidth + 3, y);
          doc.text(dateLabel.substring(0, 25), margin + colWidth * 2 + 3, y);
          doc.text(accountName.substring(0, 25), margin + colWidth * 3 + 3, y);

          // Row separator
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(margin, y + 2, pageWidth - margin, y + 2);
          y += 7;
        });
        y += 5;
      }

      // --- Charts Section ---
      const chartElements = document.querySelectorAll<HTMLElement>(
        '[data-widget-type="area"], [data-widget-type="bar"], [data-widget-type="line"], [data-widget-type="pie"]'
      );

      if (chartElements.length > 0) {
        if (y > pageHeight - 60) {
          addFooter(doc, pageWidth, pageHeight);
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(color.r, color.g, color.b);
        doc.text("Gráficas de Rendimiento", margin, y);
        y += 8;

        for (const el of Array.from(chartElements)) {
          try {
            const canvas = await html2canvas(el, {
              backgroundColor: "#1a1a2e",
              scale: 2,
              useCORS: true,
              logging: false,
            });
            const imgData = canvas.toDataURL("image/png");
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height / canvas.width) * imgWidth;

            if (y + imgHeight > pageHeight - 20) {
              addFooter(doc, pageWidth, pageHeight);
              doc.addPage();
              y = 20;
            }

            doc.addImage(imgData, "PNG", margin, y, imgWidth, Math.min(imgHeight, pageHeight - y - 20));
            y += Math.min(imgHeight, pageHeight - y - 20) + 8;
          } catch {
            // Skip widget if capture fails
          }
        }
      }

      // Footer on last page
      addFooter(doc, pageWidth, pageHeight);

      const filename = `informe-${dashboardName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);
      toast.success(t("exportReport.pdfSuccess"));
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error(t("exportReport.pdfError"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} />
            Exportar Informe
          </DialogTitle>
          <DialogDescription>
            Descarga un PDF branded o copia el resumen en texto.
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
            {copied ? t("exportReport.copied") : t("exportReport.copyClipboard", "Copiar al Portapapeles")}
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
          >
            {generatingPdf ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t("exportReport.generatingPdf")}
              </>
            ) : (
              <>
                <Download size={18} />
                {t("exportReport.downloadPdf")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
