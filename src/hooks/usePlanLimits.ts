import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from '@/contexts/AuthContext';

interface PlanLimits {
  max_projects: number;
  max_goals_per_project: number;
  max_ai_agents: number;
  max_dashboards: number;
  max_integrations: number;
}

const UNLIMITED = -1;

export const usePlanLimits = () => {
  const { subscription, isActive } = useSubscription();
  const { user } = useAuth();

  const planId = (subscription as any)?.plan_id as string | undefined;

  const { data: plan } = useQuery({
    queryKey: ['plan_limits', planId],
    queryFn: async () => {
      if (!planId) return null;
      const { data, error } = await supabase
        .from('plans')
        .select('max_projects, max_goals_per_project, max_ai_agents, max_dashboards, max_integrations')
        .eq('id', planId)
        .maybeSingle();
      if (error) throw error;
      return data as PlanLimits | null;
    },
    enabled: !!planId,
  });

  const checkLimit = async (resource: keyof PlanLimits, countFn: () => Promise<number>): Promise<boolean> => {
    if (!isActive || !plan) return true; // no plan = allow (fallback)
    const limit = plan[resource];
    if (limit === UNLIMITED) return true;
    const current = await countFn();
    return current < limit;
  };

  const canCreateProject = async () => {
    if (!user) return false;
    return checkLimit('max_projects', async () => {
      const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      return count ?? 0;
    });
  };

  const canAddGoal = async (projectId: string) => {
    return checkLimit('max_goals_per_project', async () => {
      const { count } = await supabase.from('project_goals').select('id', { count: 'exact', head: true }).eq('project_id', projectId);
      return count ?? 0;
    });
  };

  const canCreateDashboard = async () => {
    if (!user) return false;
    return checkLimit('max_dashboards', async () => {
      const { count } = await supabase.from('dashboards').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      return count ?? 0;
    });
  };

  const canConnectIntegration = async () => {
    if (!user) return false;
    return checkLimit('max_integrations', async () => {
      const { count } = await supabase.from('user_integrations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'connected');
      return count ?? 0;
    });
  };

  return {
    plan,
    limits: plan,
    canCreateProject,
    canAddGoal,
    canCreateDashboard,
    canConnectIntegration,
    hasPlan: !!plan,
  };
};
