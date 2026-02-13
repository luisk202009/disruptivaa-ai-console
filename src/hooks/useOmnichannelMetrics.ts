import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformMetrics {
  spend: number;
  clicks: number;
  impressions: number;
  cpc: number;
  conversions: number;
  isDemo: boolean;
}

export interface OmnichannelData {
  platforms: {
    meta: PlatformMetrics | null;
    google: PlatformMetrics | null;
    tiktok: PlatformMetrics | null;
  };
  consolidated: {
    totalSpend: number;
    combinedCPA: number;
    avgROAS: number;
    allDemo: boolean;
  };
  loading: boolean;
}

const EMPTY_DATA: OmnichannelData = {
  platforms: { meta: null, google: null, tiktok: null },
  consolidated: { totalSpend: 0, combinedCPA: 0, avgROAS: 0, allDemo: true },
  loading: false,
};

export const useOmnichannelMetrics = () => {
  const [data, setData] = useState<OmnichannelData>(EMPTY_DATA);

  const fetchPlatformMetrics = async (
    functionName: string,
    accessToken: string
  ): Promise<PlatformMetrics | null> => {
    try {
      const metrics = ["spend", "clicks", "impressions", "cpc", "conversions"];
      const results = await Promise.all(
        metrics.map(async (metric) => {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ metric, date_preset: "last_30d", comparison: false }),
            }
          );
          if (!response.ok) return null;
          const result = await response.json();
          return { value: result.value ?? 0, is_demo: result.is_demo ?? true };
        })
      );

      if (!results[0]) return null;

      let isDemo = false;
      const values: number[] = [];
      for (let i = 0; i < metrics.length; i++) {
        values.push(results[i]?.value ?? 0);
        if (results[i]?.is_demo) isDemo = true;
      }

      return {
        spend: values[0],
        clicks: values[1],
        impressions: values[2],
        cpc: values[3],
        conversions: values[4],
        isDemo,
      };
    } catch {
      return null;
    }
  };

  const fetchAllMetrics = useCallback(async (): Promise<OmnichannelData> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return EMPTY_DATA;

    const token = session.access_token;
    const platforms = [
      { key: "meta" as const, fn: "fetch-meta-metrics" },
      { key: "google" as const, fn: "fetch-google-ads-metrics" },
      { key: "tiktok" as const, fn: "fetch-tiktok-ads-metrics" },
    ];

    const result: { meta: PlatformMetrics | null; google: PlatformMetrics | null; tiktok: PlatformMetrics | null } = {
      meta: null, google: null, tiktok: null,
    };

    await Promise.all(
      platforms.map(async (p) => {
        result[p.key] = await fetchPlatformMetrics(p.fn, token);
      })
    );

    const active = Object.entries(result).filter(([, v]) => v !== null) as [string, PlatformMetrics][];
    const totalSpend = active.reduce((s, [, v]) => s + v.spend, 0);
    const totalConversions = active.reduce((s, [, v]) => s + v.conversions, 0);
    const combinedCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const avgROAS = totalSpend > 0 && totalConversions > 0 ? (totalConversions * 10) / totalSpend : 0;
    const allDemo = active.every(([, v]) => v.isDemo);

    const omnichannelData: OmnichannelData = {
      platforms: result,
      consolidated: { totalSpend, combinedCPA, avgROAS, allDemo },
      loading: false,
    };

    setData(omnichannelData);
    return omnichannelData;
  }, []);

  return { data, fetchAllMetrics };
};
