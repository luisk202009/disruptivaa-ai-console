import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Integration {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected';
  connected_at: string | null;
  account_name: string | null;
}

const PLATFORM_ACCOUNTS: Record<string, string> = {
  meta_ads: 'Business Manager Demo',
  google_ads: 'Google Ads Demo Account',
  tiktok_ads: 'TikTok Business Center',
};

export const useIntegrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    if (!user) {
      setIntegrations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setIntegrations(data?.map(item => ({
        id: item.id,
        platform: item.platform,
        status: item.status as 'connected' | 'disconnected',
        connected_at: item.connected_at,
        account_name: item.account_name,
      })) || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (platform: string) => {
    if (!user) return false;

    setConnecting(platform);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const existingIntegration = integrations.find(i => i.platform === platform);

      if (existingIntegration) {
        const { error } = await supabase
          .from('user_integrations')
          .update({
            status: 'connected',
            connected_at: new Date().toISOString(),
            account_name: PLATFORM_ACCOUNTS[platform],
          })
          .eq('id', existingIntegration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_integrations')
          .insert({
            user_id: user.id,
            platform,
            status: 'connected',
            connected_at: new Date().toISOString(),
            account_name: PLATFORM_ACCOUNTS[platform],
          });

        if (error) throw error;
      }

      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error connecting platform:', error);
      return false;
    } finally {
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (platform: string) => {
    if (!user) return false;

    setConnecting(platform);

    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({
          status: 'disconnected',
          connected_at: null,
          account_name: null,
        })
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;

      await fetchIntegrations();
      return true;
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      return false;
    } finally {
      setConnecting(null);
    }
  };

  const getIntegration = (platform: string) => {
    return integrations.find(i => i.platform === platform);
  };

  const getConnectedPlatforms = () => {
    return integrations.filter(i => i.status === 'connected');
  };

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-integrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_integrations',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchIntegrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    integrations,
    loading,
    connecting,
    connectPlatform,
    disconnectPlatform,
    getIntegration,
    getConnectedPlatforms,
  };
};
