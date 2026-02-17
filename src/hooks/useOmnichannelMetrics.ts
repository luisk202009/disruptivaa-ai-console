import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformMetrics {
  spend: number;
  clicks: number;
  impressions: number;
  cpc: number;
  conversions: number;
  isDemo: boolean;
  currency?: string;
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
  error: string | null;
}

const EMPTY_DATA: OmnichannelData = {
  platforms: { meta: null, google: null, tiktok: null },
  consolidated: { totalSpend: 0, combinedCPA: 0, avgROAS: 0, allDemo: true },
  loading: false,
  error: null,
};

const PLATFORM_INTEGRATION_MAP: Record<string, string> = {
  meta: "meta_ads",
  google: "google_ads",
  tiktok: "tiktok_ads",
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
      return { value: result.value ?? 0, is_demo: result.is_demo ?? true, currency: result.currency };
        })
      );

      if (!results[0]) return null;

      let isDemo = false;
      const values: number[] = [];
      for (let i = 0; i < metrics.length; i++) {
        values.push(results[i]?.value ?? 0);
        if (results[i]?.is_demo) isDemo = true;
      }

      // Capture currency from first response
      const currency = results[0]?.currency ?? "USD";

      return {
        spend: values[0],
        clicks: values[1],
        impressions: values[2],
        cpc: values[3],
        conversions: values[4],
        isDemo,
        currency,
      };
    } catch {
      return null;
    }
  };

  const fetchAllMetrics = useCallback(async (): Promise<OmnichannelData> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return EMPTY_DATA;

    const token = session.access_token;

    // Query connected integrations to filter platforms
    const { data: integrations } = await supabase
      .from("user_integrations")
      .select("platform, status")
      .eq("user_id", session.user.id)
      .eq("status", "connected");

    const connectedPlatforms = new Set(
      (integrations || []).map((i) => i.platform)
    );

    const allPlatforms = [
      { key: "meta" as const, fn: "fetch-meta-metrics" },
      { key: "google" as const, fn: "fetch-google-ads-metrics" },
      { key: "tiktok" as const, fn: "fetch-tiktok-ads-metrics" },
    ];

    // Only fetch platforms with connected integrations
    const platforms = allPlatforms.filter(
      (p) => connectedPlatforms.has(PLATFORM_INTEGRATION_MAP[p.key])
    );

    const result: { meta: PlatformMetrics | null; google: PlatformMetrics | null; tiktok: PlatformMetrics | null } = {
      meta: null, google: null, tiktok: null,
    };

    const errors: string[] = [];

    await Promise.all(
      platforms.map(async (p) => {
        try {
          result[p.key] = await fetchPlatformMetrics(p.fn, token);
        } catch (e) {
          errors.push(p.key);
        }
      })
    );

    const active = Object.entries(result).filter(([, v]) => v !== null) as [string, PlatformMetrics][];
    const totalSpend = active.reduce((s, [, v]) => s + v.spend, 0);
    const totalConversions = active.reduce((s, [, v]) => s + v.conversions, 0);
    const combinedCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const avgROAS = totalSpend > 0 && totalConversions > 0 ? (totalConversions * 10) / totalSpend : 0;
    const allDemo = active.every(([, v]) => v.isDemo);

    // Only report error if NO platform returned data and there were connected platforms
    const error = active.length === 0 && platforms.length > 0
      ? "No se pudieron obtener métricas de ninguna plataforma conectada."
      : null;

    const omnichannelData: OmnichannelData = {
      platforms: result,
      consolidated: { totalSpend, combinedCPA, avgROAS, allDemo },
      loading: false,
      error,
    };

    setData(omnichannelData);
    return omnichannelData;
  }, []);

  return { data, fetchAllMetrics };
};
