import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MetricConfig, MetricType, DatePreset } from "./useWidgets";

export interface MetricData {
  value: number;
  previous_value?: number;
  change_percent?: number;
  trend?: "up" | "down" | "neutral";
  data_points?: { date: string; value: number }[];
}

interface MetricResult {
  data: MetricData | null;
  loading: boolean;
  error: string | null;
}

// Metric labels for display
export const METRIC_LABELS: Record<MetricType, string> = {
  impressions: "Impresiones",
  clicks: "Clics",
  spend: "Gasto",
  reach: "Alcance",
  ctr: "CTR",
  cpc: "CPC",
  cpm: "CPM",
};

// Metric formats
export const METRIC_FORMATS: Record<MetricType, "number" | "currency" | "percent"> = {
  impressions: "number",
  clicks: "number",
  spend: "currency",
  reach: "number",
  ctr: "percent",
  cpc: "currency",
  cpm: "currency",
};

// Date preset labels
export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  last_7d: "Últimos 7 días",
  last_30d: "Últimos 30 días",
  this_month: "Este mes",
};

export const useMetaMetrics = () => {
  const [cache, setCache] = useState<Map<string, { data: MetricData; timestamp: number }>>(new Map());
  const { user } = useAuth();
  
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCacheKey = (config: MetricConfig): string => {
    return JSON.stringify(config);
  };

  const fetchMetric = useCallback(async (config: MetricConfig): Promise<MetricResult> => {
    if (!user) {
      return { data: null, loading: false, error: "No user logged in" };
    }

    const cacheKey = getCacheKey(config);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { data: cached.data, loading: false, error: null };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { data: null, loading: false, error: "No session" };
      }

      const response = await supabase.functions.invoke("fetch-meta-metrics", {
        body: {
          metric: config.metric,
          date_preset: config.date_preset,
          account_id: config.account_id,
          comparison: config.comparison ?? true,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const metricData: MetricData = response.data;
      
      // Update cache
      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, { data: metricData, timestamp: Date.now() });
        return newCache;
      });

      return { data: metricData, loading: false, error: null };
    } catch (error) {
      console.error("Error fetching metric:", error);
      return { 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }, [user, cache, CACHE_TTL]);

  const formatValue = (value: number, metric: MetricType): string => {
    const format = METRIC_FORMATS[metric];
    
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      case "percent":
        return `${value.toFixed(2)}%`;
      case "number":
      default:
        return new Intl.NumberFormat("es-MX", {
          notation: value >= 1000000 ? "compact" : "standard",
          maximumFractionDigits: 1,
        }).format(value);
    }
  };

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    fetchMetric,
    formatValue,
    clearCache,
    METRIC_LABELS,
    METRIC_FORMATS,
    DATE_PRESET_LABELS,
  };
};
