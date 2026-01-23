import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type GoalMetricKey = 'cpa' | 'roas' | 'ctr' | 'cpc' | 'spend' | 'conversions';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly';

export interface ProjectGoal {
  id: string;
  project_id: string;
  metric_key: GoalMetricKey;
  target_value: number;
  currency: string;
  period: GoalPeriod;
  created_at: string;
  updated_at: string;
}

export const GOAL_METRIC_LABELS: Record<GoalMetricKey, string> = {
  cpa: "CPA (Costo por Adquisición)",
  roas: "ROAS (Retorno de Inversión)",
  ctr: "CTR (Tasa de Clics)",
  cpc: "CPC (Costo por Clic)",
  spend: "Presupuesto Máximo",
  conversions: "Conversiones Objetivo",
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
};

interface UseProjectGoalsOptions {
  projectId?: string;
}

export const useProjectGoals = (options: UseProjectGoalsOptions = {}) => {
  const [goals, setGoals] = useState<ProjectGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { projectId } = options;

  const fetchGoals = useCallback(async () => {
    if (!user || !projectId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("project_goals")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setGoals((data || []) as ProjectGoal[]);
    } catch (error) {
      console.error("Error fetching project goals:", error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  const upsertGoal = async (
    goal: Omit<ProjectGoal, "id" | "created_at" | "updated_at">
  ): Promise<ProjectGoal | null> => {
    if (!user || !projectId) return null;

    try {
      const { data, error } = await supabase
        .from("project_goals")
        .upsert(
          {
            project_id: goal.project_id,
            metric_key: goal.metric_key,
            target_value: goal.target_value,
            currency: goal.currency,
            period: goal.period,
          },
          { onConflict: "project_id,metric_key" }
        )
        .select()
        .single();

      if (error) throw error;
      
      return data as ProjectGoal;
    } catch (error) {
      console.error("Error upserting project goal:", error);
      return null;
    }
  };

  const deleteGoal = async (goalId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("project_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting project goal:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchGoals();

    if (!user || !projectId) return;

    const channel = supabase
      .channel(`project-goals-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_goals",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId, fetchGoals]);

  return {
    goals,
    loading,
    upsertGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
};

// Helper to format goal values for display
export const formatGoalValue = (goal: ProjectGoal): string => {
  const { metric_key, target_value, currency } = goal;
  
  switch (metric_key) {
    case 'cpa':
    case 'cpc':
    case 'spend':
      return `${currency === 'USD' ? '$' : currency} ${target_value.toLocaleString()}`;
    case 'roas':
      return `${target_value}x`;
    case 'ctr':
      return `${target_value}%`;
    case 'conversions':
      return target_value.toLocaleString();
    default:
      return String(target_value);
  }
};
