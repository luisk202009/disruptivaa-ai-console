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
  Table,
  Building2,
  CheckCircle2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Widget, WidgetType, MetricType, MetricConfig, GridSettings } from "@/hooks/useWidgets";
import { METRIC_LABELS } from "@/hooks/useMetaMetrics";
import { MetaAccountDetail } from "@/hooks/useIntegrations";
import { cn } from "@/lib/utils";

interface WidgetSelectorProps {
  accounts: MetaAccountDetail[];
  accountsLoading?: boolean;
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

type Step = "metric" | "type" | "account";

export const WidgetSelector = ({ accounts, accountsLoading, onAddWidget, onClose }: WidgetSelectorProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("metric");

  const handleSelectMetric = (metric: MetricType, suggestedType: WidgetType) => {
    setSelectedMetric(metric);
    setSelectedType(suggestedType);
    setStep("type");
  };

  const handleSelectChart = (type: WidgetType) => {
    setSelectedMetric("impressions"); // Default metric for charts
    setSelectedType(type);
    setStep("account");
  };

  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type);
    setStep("account");
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccount(accountId);
  };

  const handleAdd = () => {
    if (!selectedMetric || !selectedType) return;

    const metricConfig: MetricConfig = {
      metric: selectedMetric,
      date_preset: "last_7d",
      comparison: true,
      account_id: selectedAccount || undefined,
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

  const canAdd = selectedMetric && selectedType;
  const hasAccounts = accounts.length > 0;

  const renderAccountStep = () => (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Building2 size={16} />
        <span>Selecciona una cuenta de anuncios</span>
      </div>
      
      {accountsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : !hasAccounts ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle size={32} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay cuentas de Meta Ads conectadas.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Puedes añadir el widget sin cuenta y configurarlo después.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-auto">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                selectedAccount === account.id && "border-primary bg-primary/5"
              )}
              onClick={() => handleSelectAccount(account.id)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <CardDescription className="text-sm">
                        ID: {account.id}
                      </CardDescription>
                    </div>
                  </div>
                  {selectedAccount === account.id && (
                    <CheckCircle2 size={20} className="text-primary" />
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full max-h-[85vh] flex flex-col">
      {/* Header - Fixed */}
      <SheetHeader className="pb-4 flex-shrink-0">
        <SheetTitle>Añadir Widget</SheetTitle>
        <SheetDescription>
          {step === "metric" && "Selecciona una métrica o tipo de gráfico."}
          {step === "type" && "Selecciona cómo visualizar la métrica."}
          {step === "account" && "Selecciona la cuenta de anuncios (opcional)."}
        </SheetDescription>
      </SheetHeader>

      {/* Progress indicator - Fixed */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <div className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          step === "metric" ? "bg-primary" : "bg-primary"
        )} />
        <div className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          step === "type" || step === "account" ? "bg-primary" : "bg-muted"
        )} />
        <div className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          step === "account" ? "bg-primary" : "bg-muted"
        )} />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        {step === "account" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 size={16} />
              <span>Selecciona una cuenta de anuncios</span>
            </div>
            
            {accountsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : !hasAccounts ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle size={32} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay cuentas de Meta Ads conectadas.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Puedes añadir el widget sin cuenta y configurarlo después.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <Card
                    key={account.id}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedAccount === account.id && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleSelectAccount(account.id)}
                  >
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Building2 size={18} />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base truncate">{account.name}</CardTitle>
                            <CardDescription className="text-xs sm:text-sm truncate">
                              ID: {account.id}
                            </CardDescription>
                          </div>
                        </div>
                        {selectedAccount === account.id && (
                          <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="metrics" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-4 flex-1">
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
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          {option.icon}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm sm:text-base">{METRIC_LABELS[option.metric]}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{option.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {step === "type" && selectedMetric && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3 text-sm sm:text-base">Tipo de visualización</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { type: "kpi" as const, label: "KPI", icon: <TrendingUp size={16} /> },
                      { type: "line" as const, label: "Línea", icon: <Activity size={16} /> },
                      { type: "bar" as const, label: "Barras", icon: <BarChart3 size={16} /> },
                    ].map((opt) => (
                      <Button
                        key={opt.type}
                        variant={selectedType === opt.type ? "default" : "outline"}
                        className="justify-start gap-2"
                        onClick={() => handleSelectType(opt.type)}
                      >
                        {opt.icon}
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="charts" className="mt-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CHART_OPTIONS.map((option) => (
                  <Card
                    key={option.type}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50",
                      selectedType === option.type && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleSelectChart(option.type)}
                  >
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          {option.icon}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm sm:text-base">{option.label}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{option.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Footer - Sticky */}
      <div className="pt-4 border-t flex-shrink-0 bg-background">
        <div className="flex gap-2">
          {step !== "metric" ? (
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setStep(step === "account" ? "type" : "metric")}
            >
              Atrás
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button 
            className="flex-1" 
            onClick={step === "account" ? handleAdd : () => setStep("account")}
            disabled={!canAdd}
          >
            {step === "account" ? "Añadir Widget" : "Siguiente"}
          </Button>
        </div>
      </div>
    </div>
  );
};
