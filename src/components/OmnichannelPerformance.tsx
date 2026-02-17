import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, DollarSign, Target, AlertTriangle, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useOmnichannelMetrics, PlatformMetrics } from "@/hooks/useOmnichannelMetrics";

const PLATFORM_COLORS: Record<string, string> = {
  meta: "#1877F2",
  google: "#4285F4",
  tiktok: "#EF7911",
};

const OmnichannelPerformance = () => {
  const { t } = useTranslation("common");
  const { data: omnichannelData, fetchAllMetrics } = useOmnichannelMetrics();
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAllMetrics();
      setLoading(false);
    };
    load();
  }, [fetchAllMetrics]);

  const data = omnichannelData.platforms;

  // Use consolidated data from hook
  const activePlatforms = Object.entries(data).filter(([, v]) => v !== null) as [string, PlatformMetrics][];
  const { totalSpend, combinedCPA, avgROAS, allDemo } = omnichannelData.consolidated;
  
  // Get currency from first active platform
  const detectedCurrency = activePlatforms.length > 0 ? (activePlatforms[0][1].currency || "USD") : "USD";
  const noDecimals = ["COP", "CLP", "JPY", "KRW"];
  const useDecimals = !noDecimals.includes(detectedCurrency);
  const currencyLocale = detectedCurrency === "COP" ? "es-CO" : detectedCurrency === "EUR" ? "es-ES" : detectedCurrency === "MXN" ? "es-MX" : "en-US";
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(currencyLocale, {
      style: "currency",
      currency: detectedCurrency,
      minimumFractionDigits: useDecimals ? 2 : 0,
      maximumFractionDigits: useDecimals ? 2 : 0,
    }).format(value);
  };

  // Chart data
  const chartData = activePlatforms.map(([key, v]) => ({
    name: t(`omnichannel.${key}Ads`),
    spend: Math.round(v.spend * 100) / 100,
    platformKey: key,
  }));

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 mb-6 animate-fade-in space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (omnichannelData.error) {
    return (
      <div className="glass rounded-xl p-6 mb-6 animate-fade-in">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{omnichannelData.error}</span>
        </div>
      </div>
    );
  }

  if (activePlatforms.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass rounded-xl mb-6 animate-fade-in overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">{t("omnichannel.title")}</h3>
            {allDemo && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {t("omnichannel.demoData")}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{t("omnichannel.period")}: 30d</span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <KPICard
                icon={DollarSign}
                label={t("omnichannel.totalSpend")}
                value={formatCurrency(totalSpend)}
              />
              <KPICard
                icon={Target}
                label={t("omnichannel.combinedCPA")}
                value={combinedCPA > 0 ? formatCurrency(combinedCPA) : "—"}
              />
              <KPICard
                icon={TrendingUp}
                label={t("omnichannel.avgROAS")}
                value={avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "—"}
              />
            </div>

            {/* TikTok Demo Note */}
            {data.tiktok?.isDemo && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                <AlertTriangle className="w-3 h-3" />
                <span>{t("omnichannel.tiktokDemoNote")}</span>
              </div>
            )}

            {/* Bar Chart */}
            {chartData.length > 1 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("omnichannel.spendByPlatform")}</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [formatCurrency(value), t("omnichannel.totalSpend")]}
                      />
                      <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.platformKey} fill={PLATFORM_COLORS[entry.platformKey]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

function KPICard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default OmnichannelPerformance;
