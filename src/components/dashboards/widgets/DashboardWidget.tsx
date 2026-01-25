import { useState, useEffect } from "react";
import { MoreVertical, GripVertical, Pencil, Trash2, RefreshCw, AlertCircle, Settings, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Widget, DatePreset } from "@/hooks/useWidgets";
import { useMetaMetrics, MetricData } from "@/hooks/useMetaMetrics";
import { KPIWidget } from "./KPIWidget";
import { LineChartWidget } from "./LineChartWidget";
import { BarChartWidget } from "./BarChartWidget";
import { PieChartWidget } from "./PieChartWidget";
import { AreaChartWidget } from "./AreaChartWidget";
import { GoalTrackerWidget } from "./GoalTrackerWidget";
import { cn } from "@/lib/utils";
import { ProjectGoal } from "@/hooks/useProjectGoals";

interface DashboardWidgetProps {
  widget: Widget;
  globalDatePreset: DatePreset;
  onEdit: () => void;
  onDelete: () => void;
}

export const DashboardWidget = ({
  widget,
  globalDatePreset,
  onEdit,
  onDelete,
}: DashboardWidgetProps) => {
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const { fetchMetric } = useMetaMetrics();

  const loadData = async () => {
    // Don't load if no account configured
    if (!widget.metric_config.account_id) {
      setLoading(false);
      setError("no_account");
      return;
    }

    setLoading(true);
    setError(null);
    setIsDemo(false);
    
    const config = {
      ...widget.metric_config,
      date_preset: globalDatePreset,
    };
    
    const result = await fetchMetric(config);
    
    if (result.error) {
      setError(result.error);
      setData(null);
    } else if (result.data) {
      // Check if this is demo data
      if ((result.data as any).is_demo) {
        setIsDemo(true);
        // Don't show demo data - treat as no data
        setData(null);
        setError("no_integration");
      } else {
        setData(result.data);
      }
    } else {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [widget.metric_config, globalDatePreset]);

  // Check if account is configured
  const hasAccountConfigured = !!widget.metric_config.account_id;

  const renderContent = () => {
    // Show empty state if no account is configured
    if (!hasAccountConfigured || error === "no_account") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">⚠️ Configuración requerida</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Selecciona una cuenta de anuncios en la configuración para ver métricas reales
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
            <Settings size={14} />
            Configurar
          </Button>
        </div>
      );
    }

    // Show empty state if no Meta integration
    if (error === "no_integration" || isDemo) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">⚠️ Conexión requerida</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Conecta tu cuenta de Meta Ads para ver métricas reales
            </p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-4">
          <AlertCircle size={24} className="text-destructive" />
          <p className="text-sm text-center">Error al cargar datos</p>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw size={14} />
            Reintentar
          </Button>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-4">
          <AlertTriangle size={24} className="text-amber-500" />
          <p className="text-sm text-center">Sin datos disponibles</p>
          <p className="text-xs text-center max-w-[180px]">
            No hay datos de métricas para el período seleccionado
          </p>
        </div>
      );
    }

    const props = { widget, data };

    switch (widget.type) {
      case "kpi":
        return <KPIWidget {...props} />;
      case "line":
        return <LineChartWidget {...props} />;
      case "bar":
        return <BarChartWidget {...props} />;
      case "pie":
        return <PieChartWidget {...props} />;
      case "area":
        return <AreaChartWidget {...props} />;
      case "goal_tracker":
        // Goal tracker requires a goal from metric_config
        const goal = widget.metric_config.goal_data as ProjectGoal | undefined;
        if (!goal) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">⚠️ Meta no configurada</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  Selecciona una meta del proyecto en la configuración
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                <Settings size={14} />
                Configurar
              </Button>
            </div>
          );
        }
        return <GoalTrackerWidget widget={widget} data={data} goal={goal} />;
      default:
        return <KPIWidget {...props} />;
    }
  };

  // Get display account name
  const accountName = widget.metric_config.account_name || 
    (widget.metric_config.account_id ? `Cuenta ${widget.metric_config.account_id}` : null);

  return (
    <div className={cn(
      "h-full flex flex-col glass rounded-xl overflow-hidden",
      "transition-shadow hover:shadow-lg"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted/50 flex-shrink-0">
            <GripVertical size={14} className="text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm text-foreground truncate">
              {widget.title}
            </h3>
            {accountName && (
              <p className="text-xs text-muted-foreground truncate">
                {accountName}
              </p>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={loadData}>
              <RefreshCw size={14} className="mr-2" />
              Actualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil size={14} className="mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 size={14} className="mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};
