import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Wrench, FileDown, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "@/components/Sidebar";
import { useDashboards } from "@/hooks/useDashboards";
import { useWidgets, Widget, GridSettings, DatePreset, DataSource } from "@/hooks/useWidgets";
import { useIntegrations, MetaAccountDetail } from "@/hooks/useIntegrations";
import { DashboardCanvas } from "@/components/dashboards/DashboardCanvas";
import { WidgetSelector } from "@/components/dashboards/WidgetSelector";
import { WidgetSettings } from "@/components/dashboards/WidgetSettings";
import { BulkAccountAssignDialog } from "@/components/dashboards/BulkAccountAssignDialog";
import { ExportReportDialog } from "@/components/dashboards/ExportReportDialog";
import { DATE_PRESET_LABELS } from "@/hooks/useMetaMetrics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const dateFnsLocales: Record<string, typeof es> = { es, en: enUS, pt };

const DashboardView = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { dashboards, loading: dashboardLoading } = useDashboards();
  const { widgets, loading: widgetsLoading, addWidget, updateWidget, updateWidgetPositions, removeWidget } = useWidgets({
    dashboardId,
  });
  const { getAccountDetailsByPlatform } = useIntegrations();
  
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [showBulkAccountModal, setShowBulkAccountModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [globalDatePreset, setGlobalDatePreset] = useState<DatePreset>("last_7d");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  
  // Meta accounts state
  const [accounts, setAccounts] = useState<MetaAccountDetail[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
  // Detect dominant platform from widgets
  const dominantPlatform: DataSource = (() => {
    if (widgets.length === 0) return "meta_ads" as DataSource;
    const counts: Record<string, number> = {};
    widgets.forEach((w) => {
      const src = w.data_source || "meta_ads";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as DataSource;
  })();

  // Unconfigured widgets detection
  const unconfiguredWidgets = widgets.filter(
    (w) => !w.metric_config.account_id
  );
  const hasUnconfiguredWidgets = unconfiguredWidgets.length > 0;

  const dashboard = dashboards.find((d) => d.id === dashboardId);

  // Load accounts filtered by dominant platform
  useEffect(() => {
    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const accountDetails = await getAccountDetailsByPlatform(dominantPlatform as 'meta_ads' | 'google_ads' | 'tiktok_ads');
        setAccounts(accountDetails);
      } catch (error) {
        console.error("Error loading accounts:", error);
      } finally {
        setAccountsLoading(false);
      }
    };

    if (showWidgetSelector || showWidgetSettings || showBulkAccountModal) {
      loadAccounts();
    }
  }, [showWidgetSelector, showWidgetSettings, showBulkAccountModal, dominantPlatform]);

  useEffect(() => {
    if (!dashboardLoading && !dashboard) {
      navigate("/dashboards");
    }
  }, [dashboard, dashboardLoading, navigate]);

  // Track when widgets finish loading
  useEffect(() => {
    if (!widgetsLoading && widgets.length > 0) {
      setLastUpdated(new Date());
    }
  }, [widgetsLoading, widgets.length]);

  // Refresh "updated X ago" text every 30s
  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

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

  const handleBulkAssign = async (accountId: string, accountName: string) => {
    const updates = unconfiguredWidgets.map((widget) =>
      updateWidget(widget.id, {
        metric_config: {
          ...widget.metric_config,
          account_id: accountId,
          account_name: accountName,
        },
      })
    );
    await Promise.all(updates);
    setShowBulkAccountModal(false);
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
        <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-card/50">
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
            {/* Bulk Account Assignment Button */}
            {hasUnconfiguredWidgets && (
              <Button
                variant="outline"
                className="gap-2 border-amber-500/50 text-amber-500 hover:bg-accent"
                onClick={() => setShowBulkAccountModal(true)}
              >
                <Wrench size={16} />
                Vincular cuenta ({unconfiguredWidgets.length})
              </Button>
            )}

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

            {/* Export Report Button */}
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowExportDialog(true)}
              disabled={widgets.length === 0}
            >
              <FileDown size={18} />
              Exportar
            </Button>

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
                  accounts={accounts}
                  accountsLoading={accountsLoading}
                  onAddWidget={handleAddWidget}
                  onClose={() => setShowWidgetSelector(false)}
                  platform={dominantPlatform}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-auto relative">
          {lastUpdated && (
            <div className="absolute top-2 right-8 flex items-center gap-1.5 text-xs text-muted-foreground z-10">
              <Clock size={12} />
              <span>
                {t("dashboard.dataUpdated")}{" "}
                {formatDistanceToNow(lastUpdated, {
                  addSuffix: true,
                  locale: dateFnsLocales[i18n.language] || es,
                })}
              </span>
            </div>
          )}
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
                accounts={accounts}
                accountsLoading={accountsLoading}
                onUpdate={handleUpdateWidget}
                onClose={() => {
                  setShowWidgetSettings(false);
                  setSelectedWidget(null);
                }}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Bulk Account Assignment Dialog */}
        <BulkAccountAssignDialog
          open={showBulkAccountModal}
          onOpenChange={setShowBulkAccountModal}
          widgets={unconfiguredWidgets}
          accounts={accounts}
          accountsLoading={accountsLoading}
          onAssign={handleBulkAssign}
          platform={dominantPlatform}
        />

        {/* Export Report Dialog */}
        <ExportReportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          widgets={widgets}
          dashboardName={dashboard.name}
        />
      </main>
    </div>
  );
};

export default DashboardView;
