import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

export const useSubscription = () => {
  const { profile } = useUserProfile();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  return {
    subscription,
    isActive: subscription?.status === 'active',
    isLoading,
  };
};
