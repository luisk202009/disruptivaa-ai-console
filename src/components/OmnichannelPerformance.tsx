import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, DollarSign, Target, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PlatformMetrics {
  spend: number;
  clicks: number;
  impressions: number;
  cpc: number;
  conversions: number;
  isDemo: boolean;
}

interface PlatformData {
  meta: PlatformMetrics | null;
  google: PlatformMetrics | null;
  tiktok: PlatformMetrics | null;
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: "#1877F2",
  google: "#4285F4",
  tiktok: "#EF7911",
};

const OmnichannelPerformance = () => {
  const { t } = useTranslation("common");
  const [data, setData] = useState<PlatformData>({ meta: null, google: null, tiktok: null });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  const fetchPlatformMetrics = useCallback(async (
    functionName: string,
    metric: string
  ): Promise<{ value: number; is_demo: boolean } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ metric, date_preset: "last_30d", comparison: false }),
        }
      );

      if (!response.ok) return null;
      const result = await response.json();
      return { value: result.value ?? 0, is_demo: result.is_demo ?? true };
    } catch {
      return null;
    }
  }, []);

  const fetchAllMetrics = useCallback(async () => {
    setLoading(true);

    const platforms = [
      { key: "meta" as const, fn: "fetch-meta-metrics" },
      { key: "google" as const, fn: "fetch-google-ads-metrics" },
      { key: "tiktok" as const, fn: "fetch-tiktok-ads-metrics" },
    ];

    const metrics = ["spend", "clicks", "impressions", "cpc", "conversions"];
    const result: PlatformData = { meta: null, google: null, tiktok: null };

    // Fetch all platforms in parallel
    await Promise.all(
      platforms.map(async (platform) => {
        const results = await Promise.all(
          metrics.map((m) => fetchPlatformMetrics(platform.fn, m))
        );

        // If at least spend came back, build platform data
        if (results[0]) {
          let isDemo = false;
          const values: number[] = [];
          for (let i = 0; i < metrics.length; i++) {
            values.push(results[i]?.value ?? 0);
            if (results[i]?.is_demo) isDemo = true;
          }

          result[platform.key] = {
            spend: values[0],
            clicks: values[1],
            impressions: values[2],
            cpc: values[3],
            conversions: values[4],
            isDemo,
          };
        }
      })
    );

    setData(result);
    setLoading(false);
  }, [fetchPlatformMetrics]);

  useEffect(() => {
    fetchAllMetrics();
  }, [fetchAllMetrics]);

  // Compute consolidated KPIs
  const activePlatforms = Object.entries(data).filter(([, v]) => v !== null) as [string, PlatformMetrics][];
  const totalSpend = activePlatforms.reduce((sum, [, v]) => sum + v.spend, 0);
  const totalConversions = activePlatforms.reduce((sum, [, v]) => sum + v.conversions, 0);
  const combinedCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const avgROAS = totalSpend > 0 && totalConversions > 0 ? (totalConversions * 10) / totalSpend : 0; // Simplified ROAS estimate
  const allDemo = activePlatforms.every(([, v]) => v.isDemo);

  // Chart data
  const chartData = activePlatforms.map(([key, v]) => ({
    name: t(`omnichannel.${key}Ads`),
    spend: Math.round(v.spend * 100) / 100,
    platformKey: key,
  }));

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 mb-6 animate-fade-in">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t("omnichannel.loading")}</span>
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
                value={`$${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <KPICard
                icon={Target}
                label={t("omnichannel.combinedCPA")}
                value={combinedCPA > 0 ? `$${combinedCPA.toFixed(2)}` : "—"}
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
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, t("omnichannel.totalSpend")]}
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
