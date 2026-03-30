import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MoreVertical, GripVertical, Pencil, Trash2, RefreshCw, AlertCircle, Settings, AlertTriangle, Unplug } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const { fetchMetric } = useMetaMetrics();

  const loadData = async () => {
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
      data_source: widget.data_source,
    };
    
    const result = await fetchMetric(config);
    
    if (result.error) {
      setError(result.error);
      setData(null);
    } else if (result.data) {
      if ((result.data as any).token_expired) {
        setIsDemo(true);
        setData(null);
        setError("token_expired");
      } else if ((result.data as any).is_demo) {
        setIsDemo(true);
        setData(null);
        setError("no_integration");
      } else {
        // Inject currency from response into MetricData
        const metricData = { ...result.data };
        if ((result.data as any).currency) {
          metricData.currency = (result.data as any).currency;
        }
        setData(metricData);
      }
    } else {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [widget.metric_config, globalDatePreset]);

  const hasAccountConfigured = !!widget.metric_config.account_id;

  const renderContent = () => {
    if (!hasAccountConfigured || error === "no_account") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">⚠️ {t("widget.configRequired")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              {t("widget.selectAccount")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
            <Settings size={14} />
            {t("common.configure")}
          </Button>
        </div>
      );
    }

    if (error === "no_integration" || isDemo) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">⚠️ {t("widget.connectionRequired")}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              {t("widget.connectMeta")}
            </p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex-1 flex flex-col justify-center gap-3 p-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-2 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-4">
          <AlertCircle size={24} className="text-destructive" />
          <p className="text-sm text-center">{t("widget.loadError")}</p>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw size={14} />
            {t("common.retry")}
          </Button>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-4">
          <AlertTriangle size={24} className="text-amber-500" />
          <p className="text-sm text-center">{t("widget.noData")}</p>
          <p className="text-xs text-center max-w-[180px]">
            {t("widget.noMetricsData")}
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
        const goal = widget.metric_config.goal_data as ProjectGoal | undefined;
        if (!goal) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">⚠️ {t("widget.goalNotConfigured")}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  {t("widget.selectGoal")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                <Settings size={14} />
                {t("common.configure")}
              </Button>
            </div>
          );
        }
        return <GoalTrackerWidget widget={widget} data={data} goal={goal} />;
      default:
        return <KPIWidget {...props} />;
    }
  };

  const accountName = widget.metric_config.account_name || 
    (widget.metric_config.account_id ? t("widget.accountLabel", { id: widget.metric_config.account_id }) : null);

  return (
    <div
      data-widget-type={widget.type}
      className={cn(
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
              {t("common.refresh")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil size={14} className="mr-2" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 size={14} className="mr-2" />
              {t("common.delete")}
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