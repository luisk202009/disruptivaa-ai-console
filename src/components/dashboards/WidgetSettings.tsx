import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Widget, WidgetType, MetricType, DatePreset } from "@/hooks/useWidgets";
import { METRIC_LABELS, DATE_PRESET_LABELS } from "@/hooks/useMetaMetrics";
import { MetaAccountDetail } from "@/hooks/useIntegrations";
import { AlertCircle, Building2 } from "lucide-react";

interface WidgetSettingsProps {
  widget: Widget;
  accounts: MetaAccountDetail[];
  accountsLoading?: boolean;
  onUpdate: (updates: Partial<Pick<Widget, "title" | "type" | "metric_config">>) => void;
  onClose: () => void;
}

const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  kpi: "KPI",
  line: "Gráfico de Línea",
  bar: "Gráfico de Barras",
  pie: "Gráfico Circular",
  area: "Gráfico de Área",
  table: "Tabla",
};

export const WidgetSettings = ({ widget, accounts, accountsLoading, onUpdate, onClose }: WidgetSettingsProps) => {
  const [title, setTitle] = useState(widget.title);
  const [type, setType] = useState<WidgetType>(widget.type);
  const [metric, setMetric] = useState<MetricType>(widget.metric_config.metric);
  const [datePreset, setDatePreset] = useState<DatePreset>(widget.metric_config.date_preset);
  const [comparison, setComparison] = useState(widget.metric_config.comparison ?? true);
  const [goal, setGoal] = useState<string>(widget.metric_config.goal?.toString() || "");
  const [accountId, setAccountId] = useState<string>(widget.metric_config.account_id || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate({
        title,
        type,
        metric_config: {
          ...widget.metric_config,
          metric,
          date_preset: datePreset,
          comparison,
          goal: goal ? parseFloat(goal) : undefined,
          account_id: accountId || undefined,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const hasNoAccounts = !accountsLoading && accounts.length === 0;

  return (
    <div className="h-full flex flex-col">
      <SheetHeader className="pb-4">
        <SheetTitle>Configurar Widget</SheetTitle>
        <SheetDescription>
          Personaliza la visualización y los datos de tu widget.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-auto">
        {/* Account Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 size={14} />
            Cuenta de anuncios
          </Label>
          {hasNoAccounts ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle size={16} />
              <span>No hay cuentas conectadas. Conecta Meta Ads primero.</span>
            </div>
          ) : (
            <Select 
              value={accountId} 
              onValueChange={setAccountId}
              disabled={accountsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={accountsLoading ? "Cargando cuentas..." : "Seleccionar cuenta"} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            Selecciona la cuenta de la que obtener los datos
          </p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="widget-title">Título</Label>
          <Input
            id="widget-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del widget"
          />
        </div>

        {/* Widget Type */}
        <div className="space-y-2">
          <Label>Tipo de visualización</Label>
          <Select value={type} onValueChange={(v) => setType(v as WidgetType)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WIDGET_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metric */}
        <div className="space-y-2">
          <Label>Métrica</Label>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar métrica" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METRIC_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Preset */}
        <div className="space-y-2">
          <Label>Período de tiempo</Label>
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Comparison Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mostrar comparación</Label>
            <p className="text-sm text-muted-foreground">
              Comparar con el período anterior
            </p>
          </div>
          <Switch checked={comparison} onCheckedChange={setComparison} />
        </div>

        {/* Goal (for KPI widgets) */}
        {type === "kpi" && (
          <div className="space-y-2">
            <Label htmlFor="widget-goal">Meta (opcional)</Label>
            <Input
              id="widget-goal"
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ej: 1000"
            />
            <p className="text-xs text-muted-foreground">
              Establece un objetivo para mostrar progreso
            </p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t mt-4">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
};
