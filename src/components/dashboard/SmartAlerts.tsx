import { useTranslation } from "react-i18next";
import { Bell, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useSmartAlerts, SmartAlert } from "@/hooks/useSmartAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { GOAL_METRIC_LABELS } from "@/hooks/useProjectGoals";
import { cn } from "@/lib/utils";

const formatValue = (metricKey: string, value: number, currency: string): string => {
  const symbol = currency === "USD" ? "$" : currency;
  switch (metricKey) {
    case "cpa":
    case "cpc":
    case "spend":
      return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "roas":
      return `${value}x`;
    case "ctr":
      return `${value}%`;
    case "conversions":
      return value.toLocaleString();
    default:
      return String(value);
  }
};

const AlertCard = ({ alert, t }: { alert: SmartAlert; t: (key: string, opts?: Record<string, unknown>) => string }) => {
  const isCritical = alert.level === "critical";
  const Icon = isCritical ? AlertTriangle : AlertCircle;
  
  const metricLabel = GOAL_METRIC_LABELS[alert.metricKey]?.split(" (")[0] || alert.metricKey.toUpperCase();
  const currentFormatted = formatValue(alert.metricKey, alert.currentValue, alert.currency);
  const targetFormatted = formatValue(alert.metricKey, alert.targetValue, alert.currency);

  // Determine if value is above or below target
  const isAbove = alert.currentValue > alert.targetValue;
  const messageKey = isAbove ? "smartAlerts.above" : "smartAlerts.below";

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border-l-4",
        isCritical
          ? "border-l-red-500 bg-red-500/10"
          : "border-l-yellow-500 bg-yellow-500/10"
      )}
    >
      <Icon
        size={18}
        className={cn(
          "mt-0.5 shrink-0",
          isCritical ? "text-red-400" : "text-yellow-400"
        )}
      />
      <p className="text-sm text-foreground/80">
        {t(messageKey, {
          metric: metricLabel,
          platform: alert.platform === "combined" ? "Multi-platform" : alert.platform,
          current: currentFormatted,
          target: targetFormatted,
          percent: alert.deviationPercent,
        })}
      </p>
    </div>
  );
};

const SmartAlerts = () => {
  const { t } = useTranslation();
  const { alerts, loading, isDemo, allClear, hasGoals } = useSmartAlerts();

  // Don't render if no goals defined
  if (!loading && !hasGoals) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Bell size={18} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{t("smartAlerts.title")}</h3>
        {isDemo && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {t("smartAlerts.demoNote")}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
        </div>
      )}

      {/* All Clear */}
      {!loading && allClear && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border-l-4 border-l-green-500">
          <CheckCircle size={18} className="text-green-400 shrink-0" />
          <p className="text-sm text-foreground/80">{t("smartAlerts.allClear")}</p>
        </div>
      )}

      {/* Alerts */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} t={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;
