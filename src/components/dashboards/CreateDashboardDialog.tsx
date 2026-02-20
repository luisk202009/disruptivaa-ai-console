import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Facebook, Search, Music2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DASHBOARD_TEMPLATES, DashboardTemplate } from "@/data/dashboardTemplates";
import { cn } from "@/lib/utils";

interface CreateDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description?: string, templateId?: string) => Promise<void>;
}

type Step = "select" | "details";

const ICON_MAP = {
  meta: Facebook,
  google: Search,
  tiktok: Music2,
};

export const CreateDashboardDialog = ({
  open,
  onOpenChange,
  onCreate,
}: CreateDashboardDialogProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("select");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTemplateData = selectedTemplate
    ? DASHBOARD_TEMPLATES.find((t) => t.id === selectedTemplate)
    : null;

  const handleSelectTemplate = (templateId: string | null) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = DASHBOARD_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        setName(template.name);
        setDescription(template.description);
      }
    } else {
      setName("");
      setDescription("");
    }
    setStep("details");
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreate(name.trim(), description.trim() || undefined, selectedTemplate || undefined);
      resetState();
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep("select");
    setSelectedTemplate(null);
    setName("");
    setDescription("");
  };

  const handleClose = () => {
    if (!loading) {
      resetState();
      onOpenChange(false);
    }
  };

  const renderTemplateIcon = (template: DashboardTemplate) => {
    const Icon = ICON_MAP[template.icon];
    return <Icon className="h-6 w-6" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {step === "select" ? "Crear nuevo panel" : "Detalles del panel"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Elige un template predefinido o crea un dashboard vacío."
              : selectedTemplate
                ? `Basado en el template "${selectedTemplateData?.name}"`
                : "Crea un dashboard personalizado desde cero."}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
              {/* Empty Dashboard Option */}
              <Card
                className="p-4 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50"
                onClick={() => handleSelectTemplate(null)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <LayoutGrid className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Dashboard Vacío</p>
                    <p className="text-sm text-muted-foreground">
                      Empieza desde cero y añade widgets manualmente
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>

              {/* Separator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  O usa un template
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Templates Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {DASHBOARD_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className="p-4 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50"
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2.5 rounded-lg",
                          template.icon === "meta" && "bg-blue-500/10 text-blue-600",
                          template.icon === "google" && "bg-red-500/10 text-red-600",
                          template.icon === "tiktok" && "bg-zinc-500/10 text-zinc-600"
                        )}
                      >
                        {renderTemplateIcon(template)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{template.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {template.widgets.length} widgets
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4 pb-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del panel</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi panel de métricas"
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("widget.panelDescPlaceholder", "Panel para monitorear el rendimiento de campañas...")}
                  rows={3}
                  disabled={loading}
                />
              </div>

              {selectedTemplateData && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">Widgets incluidos:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplateData.widgets.map((widget, idx) => (
                      <Badge key={idx} variant="outline">
                        {widget.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={loading}
                className="mr-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!name.trim() || loading}>
                {loading ? "Creando..." : "Crear panel"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
