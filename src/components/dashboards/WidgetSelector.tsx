import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  Eye, 
  MousePointer, 
  Percent, 
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Table
} from "lucide-react";
import { Widget, WidgetType, MetricType, MetricConfig, GridSettings } from "@/hooks/useWidgets";
import { METRIC_LABELS } from "@/hooks/useMetaMetrics";
import { cn } from "@/lib/utils";

interface WidgetSelectorProps {
  onAddWidget: (widget: Omit<Widget, "id" | "created_at" | "updated_at" | "dashboard_id">) => void;
  onClose: () => void;
}

interface MetricOption {
  metric: MetricType;
  icon: React.ReactNode;
  description: string;
  suggestedType: WidgetType;
}

interface ChartOption {
  type: WidgetType;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const METRIC_OPTIONS: MetricOption[] = [
  { 
    metric: "spend", 
    icon: <DollarSign size={20} />, 
    description: "Gasto total en publicidad",
    suggestedType: "kpi"
  },
  { 
    metric: "impressions", 
    icon: <Eye size={20} />, 
    description: "Número de veces que se mostraron tus anuncios",
    suggestedType: "kpi"
  },
  { 
    metric: "clicks", 
    icon: <MousePointer size={20} />, 
    description: "Clics en tus anuncios",
    suggestedType: "kpi"
  },
  { 
    metric: "ctr", 
    icon: <Percent size={20} />, 
    description: "Porcentaje de clics vs impresiones",
    suggestedType: "kpi"
  },
  { 
    metric: "cpc", 
    icon: <DollarSign size={20} />, 
    description: "Costo promedio por clic",
    suggestedType: "kpi"
  },
  { 
    metric: "cpm", 
    icon: <DollarSign size={20} />, 
    description: "Costo por mil impresiones",
    suggestedType: "kpi"
  },
  { 
    metric: "reach", 
    icon: <Users size={20} />, 
    description: "Usuarios únicos alcanzados",
    suggestedType: "kpi"
  },
];

const CHART_OPTIONS: ChartOption[] = [
  { 
    type: "line", 
    icon: <TrendingUp size={20} />, 
    label: "Línea temporal",
    description: "Visualiza tendencias a lo largo del tiempo"
  },
  { 
    type: "bar", 
    icon: <BarChart3 size={20} />, 
    label: "Barras",
    description: "Compara valores entre categorías"
  },
  { 
    type: "pie", 
    icon: <PieChart size={20} />, 
    label: "Circular",
    description: "Muestra distribución porcentual"
  },
  { 
    type: "area", 
    icon: <Activity size={20} />, 
    label: "Área",
    description: "Similar a línea con relleno"
  },
];

const DEFAULT_GRID_SETTINGS: Record<WidgetType, GridSettings> = {
  kpi: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  line: { x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 3 },
  bar: { x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 3 },
  pie: { x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 3 },
  area: { x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 3 },
  table: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
};

export const WidgetSelector = ({ onAddWidget, onClose }: WidgetSelectorProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [step, setStep] = useState<"metric" | "type">("metric");

  const handleSelectMetric = (metric: MetricType, suggestedType: WidgetType) => {
    setSelectedMetric(metric);
    setSelectedType(suggestedType);
    setStep("type");
  };

  const handleSelectChart = (type: WidgetType) => {
    setSelectedMetric("impressions"); // Default metric for charts
    setSelectedType(type);
  };

  const handleAdd = () => {
    if (!selectedMetric || !selectedType) return;

    const metricConfig: MetricConfig = {
      metric: selectedMetric,
      date_preset: "last_7d",
      comparison: true,
    };

    const widget: Omit<Widget, "id" | "created_at" | "updated_at" | "dashboard_id"> = {
      type: selectedType,
      title: METRIC_LABELS[selectedMetric],
      data_source: "meta_ads",
      metric_config: metricConfig,
      grid_settings: DEFAULT_GRID_SETTINGS[selectedType],
    };

    onAddWidget(widget);
  };

  return (
    <div className="h-full flex flex-col">
      <SheetHeader className="pb-4">
        <SheetTitle>Añadir Widget</SheetTitle>
        <SheetDescription>
          Selecciona una métrica o tipo de gráfico para añadir a tu panel.
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="metrics" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="flex-1 overflow-auto mt-4">
          <div className="space-y-2">
            {METRIC_OPTIONS.map((option) => (
              <Card
                key={option.metric}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  selectedMetric === option.metric && step === "type" && "border-primary bg-primary/5"
                )}
                onClick={() => handleSelectMetric(option.metric, option.suggestedType)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {option.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{METRIC_LABELS[option.metric]}</CardTitle>
                      <CardDescription className="text-sm">{option.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {step === "type" && selectedMetric && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Tipo de visualización</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: "kpi" as const, label: "KPI", icon: <TrendingUp size={16} /> },
                  { type: "line" as const, label: "Línea", icon: <Activity size={16} /> },
                  { type: "bar" as const, label: "Barras", icon: <BarChart3 size={16} /> },
                ].map((opt) => (
                  <Button
                    key={opt.type}
                    variant={selectedType === opt.type ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setSelectedType(opt.type)}
                  >
                    {opt.icon}
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="charts" className="flex-1 overflow-auto mt-4">
          <div className="space-y-2">
            {CHART_OPTIONS.map((option) => (
              <Card
                key={option.type}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  selectedType === option.type && "border-primary bg-primary/5"
                )}
                onClick={() => handleSelectChart(option.type)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {option.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{option.label}</CardTitle>
                      <CardDescription className="text-sm">{option.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4 border-t mt-4">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleAdd}
            disabled={!selectedMetric || !selectedType}
          >
            Añadir Widget
          </Button>
        </div>
      </div>
    </div>
  );
};
