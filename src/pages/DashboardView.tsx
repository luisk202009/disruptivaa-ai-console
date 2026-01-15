import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/Sidebar";
import { useDashboards } from "@/hooks/useDashboards";
import { useWidgets, Widget, GridSettings, DatePreset } from "@/hooks/useWidgets";
import { DashboardCanvas } from "@/components/dashboards/DashboardCanvas";
import { WidgetSelector } from "@/components/dashboards/WidgetSelector";
import { WidgetSettings } from "@/components/dashboards/WidgetSettings";
import { DATE_PRESET_LABELS } from "@/hooks/useMetaMetrics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DashboardView = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const navigate = useNavigate();
  const { dashboards, loading: dashboardLoading } = useDashboards();
  const { widgets, loading: widgetsLoading, addWidget, updateWidget, updateWidgetPositions, removeWidget } = useWidgets({
    dashboardId,
  });
  
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [globalDatePreset, setGlobalDatePreset] = useState<DatePreset>("last_7d");

  const dashboard = dashboards.find((d) => d.id === dashboardId);

  useEffect(() => {
    if (!dashboardLoading && !dashboard) {
      navigate("/dashboards");
    }
  }, [dashboard, dashboardLoading, navigate]);

  const handleLayoutChange = async (newLayout: { id: string; grid_settings: GridSettings }[]) => {
    await updateWidgetPositions(newLayout);
  };

  const handleAddWidget = async (widgetData: Omit<Widget, "id" | "created_at" | "updated_at" | "dashboard_id">) => {
    if (!dashboardId) return;
    
    await addWidget({
      ...widgetData,
      dashboard_id: dashboardId,
    });
    setShowWidgetSelector(false);
  };

  const handleEditWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setShowWidgetSettings(true);
  };

  const handleUpdateWidget = async (updates: Partial<Pick<Widget, "title" | "type" | "metric_config">>) => {
    if (!selectedWidget) return;
    await updateWidget(selectedWidget.id, updates);
    setShowWidgetSettings(false);
    setSelectedWidget(null);
  };

  const handleDeleteWidget = async (widgetId: string) => {
    await removeWidget(widgetId);
  };

  if (dashboardLoading || !dashboard) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4" />
            <div className="h-[600px] bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboards")}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{dashboard.name}</h1>
              {dashboard.description && (
                <p className="text-sm text-muted-foreground">{dashboard.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Global Date Selector */}
            <Select value={globalDatePreset} onValueChange={(v) => setGlobalDatePreset(v as DatePreset)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Widget Button */}
            <Sheet open={showWidgetSelector} onOpenChange={setShowWidgetSelector}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} />
                  Añadir Widget
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <WidgetSelector
                  onAddWidget={handleAddWidget}
                  onClose={() => setShowWidgetSelector(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <DashboardCanvas
            widgets={widgets}
            loading={widgetsLoading}
            globalDatePreset={globalDatePreset}
            onLayoutChange={handleLayoutChange}
            onEditWidget={handleEditWidget}
            onDeleteWidget={handleDeleteWidget}
          />
        </div>

        {/* Widget Settings Sheet */}
        <Sheet open={showWidgetSettings} onOpenChange={setShowWidgetSettings}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            {selectedWidget && (
              <WidgetSettings
                widget={selectedWidget}
                onUpdate={handleUpdateWidget}
                onClose={() => {
                  setShowWidgetSettings(false);
                  setSelectedWidget(null);
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
};

export default DashboardView;
