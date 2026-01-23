import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";
import { DASHBOARD_TEMPLATES } from "@/data/dashboardTemplates";

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  layout_config: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useDashboards = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboards = useCallback(async () => {
    if (!user) {
      setDashboards([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDashboards((data as Dashboard[]) || []);
    } catch (error) {
      console.error("Error fetching dashboards:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createDashboard = async (name: string, description?: string): Promise<Dashboard | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("dashboards")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Dashboard;
    } catch (error) {
      console.error("Error creating dashboard:", error);
      return null;
    }
  };

  const createDashboardFromTemplate = async (
    name: string,
    description: string | undefined,
    templateId: string
  ): Promise<Dashboard | null> => {
    if (!user) return null;

    const template = DASHBOARD_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return null;

    try {
      // 1. Create the dashboard
      const { data: dashboard, error: dashboardError } = await supabase
        .from("dashboards")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          layout_config: { template_id: templateId },
        })
        .select()
        .single();

      if (dashboardError) throw dashboardError;

      // 2. Create widgets from template
      const widgetInserts = template.widgets.map((w) => ({
        dashboard_id: dashboard.id,
        type: w.type,
        title: w.title,
        data_source: w.data_source,
        metric_config: {
          metric: w.metric,
          date_preset: "last_7d",
          comparison: true,
          account_id: null,
          account_name: null,
        } as unknown as Json,
        grid_settings: w.grid_settings as unknown as Json,
      }));

      const { error: widgetsError } = await supabase
        .from("widgets")
        .insert(widgetInserts);

      if (widgetsError) throw widgetsError;

      return dashboard as Dashboard;
    } catch (error) {
      console.error("Error creating dashboard from template:", error);
      return null;
    }
  };

  const updateDashboard = async (
    id: string,
    updates: Partial<Pick<Dashboard, "name" | "description" | "layout_config" | "is_default">>
  ): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.layout_config) dbUpdates.layout_config = updates.layout_config as unknown as Json;
      
      const { error } = await supabase
        .from("dashboards")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating dashboard:", error);
      return false;
    }
  };

  const deleteDashboard = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("dashboards")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchDashboards();

    if (!user) return;

    const channel = supabase
      .channel(`dashboards-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dashboards",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDashboards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDashboards]);

  return {
    dashboards,
    loading,
    createDashboard,
    createDashboardFromTemplate,
    updateDashboard,
    deleteDashboard,
    refetch: fetchDashboards,
  };
};
