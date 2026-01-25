import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";
import { ProjectGoal } from "./useProjectGoals";

export type WidgetType = "kpi" | "line" | "bar" | "pie" | "table" | "area" | "goal_tracker";
export type DataSource = "meta_ads" | "google_ads" | "manual";
export type MetricType = "impressions" | "clicks" | "spend" | "reach" | "ctr" | "cpc" | "cpm";
export type DatePreset = "today" | "yesterday" | "last_7d" | "last_30d" | "this_month";

export interface MetricConfig {
  metric: MetricType;
  date_preset: DatePreset;
  account_id?: string;
  account_name?: string;
  campaign_id?: string;
  comparison?: boolean;
  goal?: number;
  goal_id?: string; // Reference to project_goals.id for GoalTracker widgets
  goal_data?: ProjectGoal; // Full goal object for rendering
}

export interface GridSettings {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface Widget {
  id: string;
  dashboard_id: string;
  type: WidgetType;
  title: string;
  data_source: DataSource;
  metric_config: MetricConfig;
  grid_settings: GridSettings;
  created_at: string;
  updated_at: string;
}

interface UseWidgetsOptions {
  dashboardId?: string;
}

export const useWidgets = (options: UseWidgetsOptions = {}) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { dashboardId } = options;

  const fetchWidgets = useCallback(async () => {
    if (!user || !dashboardId) {
      setWidgets([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .eq("dashboard_id", dashboardId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Parse JSONB fields
      const parsedWidgets = (data || []).map((w: Record<string, unknown>) => ({
        ...w,
        metric_config: w.metric_config as MetricConfig,
        grid_settings: w.grid_settings as GridSettings,
      })) as Widget[];
      
      setWidgets(parsedWidgets);
    } catch (error) {
      console.error("Error fetching widgets:", error);
    } finally {
      setLoading(false);
    }
  }, [user, dashboardId]);

  const addWidget = async (
    widget: Omit<Widget, "id" | "created_at" | "updated_at">
  ): Promise<Widget | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("widgets")
        .insert({
          dashboard_id: widget.dashboard_id,
          type: widget.type,
          title: widget.title,
          data_source: widget.data_source,
          metric_config: widget.metric_config as unknown as Json,
          grid_settings: widget.grid_settings as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        metric_config: data.metric_config as unknown as MetricConfig,
        grid_settings: data.grid_settings as unknown as GridSettings,
      } as Widget;
    } catch (error) {
      console.error("Error adding widget:", error);
      return null;
    }
  };

  const updateWidget = async (
    id: string,
    updates: Partial<Pick<Widget, "title" | "type" | "metric_config" | "grid_settings">>
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.metric_config) dbUpdates.metric_config = updates.metric_config as unknown as Json;
      if (updates.grid_settings) dbUpdates.grid_settings = updates.grid_settings as unknown as Json;
      
      const { error } = await supabase
        .from("widgets")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating widget:", error);
      return false;
    }
  };

  const updateWidgetPositions = async (
    updates: { id: string; grid_settings: GridSettings }[]
  ): Promise<boolean> => {
    try {
      const promises = updates.map(({ id, grid_settings }) =>
        supabase.from("widgets").update({ grid_settings: grid_settings as unknown as Json }).eq("id", id)
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error updating widget positions:", error);
      return false;
    }
  };

  const removeWidget = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("widgets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error removing widget:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchWidgets();

    if (!user || !dashboardId) return;

    const channel = supabase
      .channel(`widgets-${dashboardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "widgets",
          filter: `dashboard_id=eq.${dashboardId}`,
        },
        () => {
          fetchWidgets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, dashboardId, fetchWidgets]);

  return {
    widgets,
    loading,
    addWidget,
    updateWidget,
    updateWidgetPositions,
    removeWidget,
    refetch: fetchWidgets,
  };
};
