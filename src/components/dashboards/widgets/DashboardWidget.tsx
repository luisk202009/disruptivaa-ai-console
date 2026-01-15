import { useState, useEffect } from "react";
import { MoreVertical, GripVertical, Pencil, Trash2, RefreshCw, AlertCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const { fetchMetric } = useMetaMetrics();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    const config = {
      ...widget.metric_config,
      date_preset: globalDatePreset,
    };
    
    const result = await fetchMetric(config);
    
    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [widget.metric_config, globalDatePreset]);

  const renderContent = () => {
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
          <p className="text-sm">Sin datos disponibles</p>
          <p className="text-xs">Conecta una cuenta de Meta Ads</p>
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
      default:
        return <KPIWidget {...props} />;
    }
  };

  return (
    <div className={cn(
      "h-full flex flex-col glass rounded-xl overflow-hidden",
      "transition-shadow hover:shadow-lg"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted/50">
            <GripVertical size={14} className="text-muted-foreground" />
          </div>
          <h3 className="font-medium text-sm text-foreground truncate">
            {widget.title}
          </h3>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
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
