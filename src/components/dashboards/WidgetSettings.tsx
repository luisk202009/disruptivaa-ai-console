import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Widget, WidgetType, MetricType, DatePreset, DataSource } from "@/hooks/useWidgets";
import { METRIC_LABELS, DATE_PRESET_LABELS } from "@/hooks/useMetaMetrics";
import { MetaAccountDetail, useIntegrations } from "@/hooks/useIntegrations";
import { AlertCircle, Building2, Globe } from "lucide-react";

interface WidgetSettingsProps {
  widget: Widget;
  accounts: MetaAccountDetail[];
  accountsLoading?: boolean;
  onUpdate: (updates: Partial<Pick<Widget, "title" | "type" | "data_source" | "metric_config">>) => void;
  onClose: () => void;
}

const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  kpi: "KPI",
  line: "Gráfico de Línea",
  bar: "Gráfico de Barras",
  pie: "Gráfico Circular",
  area: "Gráfico de Área",
  table: "Tabla",
  goal_tracker: "Seguimiento de Meta",
};

const PLATFORM_LABELS: Record<DataSource, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  manual: "Manual",
};

export const WidgetSettings = ({ widget, accounts: initialAccounts, accountsLoading: initialLoading, onUpdate, onClose }: WidgetSettingsProps) => {
  const { t } = useTranslation();
  const { getAccountDetailsByPlatform } = useIntegrations();
  
  const [title, setTitle] = useState(widget.title);
  const [type, setType] = useState<WidgetType>(widget.type);
  const [platform, setPlatform] = useState<DataSource>(widget.data_source);
  const [metric, setMetric] = useState<MetricType>(widget.metric_config.metric);
  const [datePreset, setDatePreset] = useState<DatePreset>(widget.metric_config.date_preset);
  const [comparison, setComparison] = useState(widget.metric_config.comparison ?? true);
  const [goal, setGoal] = useState<string>(widget.metric_config.goal?.toString() || "");
  const [accountId, setAccountId] = useState<string>(widget.metric_config.account_id || "");
  const [loading, setLoading] = useState(false);
  
  const [accounts, setAccounts] = useState<MetaAccountDetail[]>(initialAccounts);
  const [accountsLoading, setAccountsLoading] = useState(initialLoading || false);

  useEffect(() => {
    const loadAccountsForPlatform = async () => {
      if (platform === 'manual') { setAccounts([]); return; }
      setAccountsLoading(true);
      try {
        const platformAccounts = await getAccountDetailsByPlatform(platform as 'meta_ads' | 'google_ads' | 'tiktok_ads');
        setAccounts(platformAccounts);
        if (platform !== widget.data_source) setAccountId("");
      } catch (error) {
        console.error("Error loading accounts:", error);
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    };
    loadAccountsForPlatform();
  }, [platform, getAccountDetailsByPlatform]);

  const getAccountName = (id: string): string => {
    const account = accounts.find((a) => a.id === id);
    return account?.name || "";
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const selectedAccountName = accountId ? getAccountName(accountId) : undefined;
      await onUpdate({
        title, type, data_source: platform,
        metric_config: {
          ...widget.metric_config, metric, date_preset: datePreset, comparison,
          goal: goal ? parseFloat(goal) : undefined,
          account_id: accountId || undefined,
          account_name: selectedAccountName,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const hasNoAccounts = !accountsLoading && accounts.length === 0 && platform !== 'manual';

  return (
    <div className="h-full max-h-[85vh] flex flex-col">
      <SheetHeader className="pb-4 flex-shrink-0">
        <SheetTitle>{t("widget.configureWidget")}</SheetTitle>
        <SheetDescription>{t("widget.configureWidgetDesc")}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6 space-y-6">
        {/* Platform Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Globe size={14} />{t("widget.platform")}</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as DataSource)}>
            <SelectTrigger><SelectValue placeholder={t("widget.select.platform")} /></SelectTrigger>
            <SelectContent>
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Account Selector */}
        {platform !== 'manual' && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Building2 size={14} />{t("widget.adAccount")}</Label>
            {hasNoAccounts ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle size={16} />
                <span>{t("widget.noAccountsForPlatform", { platform: PLATFORM_LABELS[platform] })}</span>
              </div>
            ) : (
              <Select value={accountId} onValueChange={setAccountId} disabled={accountsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={accountsLoading ? t("widget.loadingAccounts") : t("widget.select.account")} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">{t("widget.selectAccountData")}</p>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="widget-title">{t("widget.title")}</Label>
          <Input id="widget-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("widget.titlePlaceholder")} />
        </div>

        {/* Widget Type */}
        <div className="space-y-2">
          <Label>{t("widget.type")}</Label>
          <Select value={type} onValueChange={(v) => setType(v as WidgetType)}>
            <SelectTrigger><SelectValue placeholder={t("widget.select.type")} /></SelectTrigger>
            <SelectContent>
              {Object.entries(WIDGET_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metric */}
        <div className="space-y-2">
          <Label>{t("widget.metric")}</Label>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
            <SelectTrigger><SelectValue placeholder={t("widget.select.metric")} /></SelectTrigger>
            <SelectContent>
              {Object.entries(METRIC_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Preset */}
        <div className="space-y-2">
          <Label>{t("widget.timePeriod")}</Label>
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger><SelectValue placeholder={t("widget.select.period")} /></SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_PRESET_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Comparison Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t("widget.showComparison")}</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("widget.compareWithPrevious")}</p>
          </div>
          <Switch checked={comparison} onCheckedChange={setComparison} />
        </div>

        {/* Goal (for KPI widgets) */}
        {type === "kpi" && (
          <div className="space-y-2">
            <Label htmlFor="widget-goal">{t("widget.goalOptional")}</Label>
            <Input id="widget-goal" type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t("widget.goalPlaceholder")} />
            <p className="text-xs text-muted-foreground">{t("widget.goalProgress")}</p>
          </div>
        )}
      </div>

      {/* Footer - Sticky */}
      <div className="pt-4 border-t flex-shrink-0 bg-background">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>{t("common.cancel")}</Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading}>
            {loading ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  );
};