import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MetaAccountDetail {
  id: string;
  name: string;
  status: string;
}

export interface Integration {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected';
  connected_at: string | null;
  account_name: string | null;
  accountsCount?: number;
  accountDetails?: MetaAccountDetail[];
}

export interface ConnectionResult {
  success: boolean;
  accountsCount?: number;
  accountDetails?: MetaAccountDetail[];
  error?: string;
}

const PLATFORM_ACCOUNTS: Record<string, string> = {
  meta_ads: 'Meta Business Manager',
  google_ads: 'Google Ads Demo Account',
  tiktok_ads: 'TikTok Business Center',
};

const EDGE_FUNCTION_URL = "https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/validate-meta-connection";

export const useIntegrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [lastConnectionResult, setLastConnectionResult] = useState<ConnectionResult | null>(null);

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

  const validateMetaConnection = async (): Promise<ConnectionResult> => {
    try {
      console.log('🔄 Validating Meta connection via edge function...');
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📥 Validation response:', data);

      if (data.success) {
        return {
          success: true,
          accountsCount: data.accounts,
          accountDetails: data.accountDetails,
        };
      } else {
        return {
          success: false,
          error: data.error,
        };
      }
    } catch (error) {
      console.error('Error validating Meta connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  };

  const connectPlatform = async (platform: string): Promise<ConnectionResult> => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    setConnecting(platform);

    try {
      let connectionResult: ConnectionResult;
      let accountName = PLATFORM_ACCOUNTS[platform];

      // For Meta Ads, validate real connection
      if (platform === 'meta_ads') {
        connectionResult = await validateMetaConnection();
        
        if (!connectionResult.success) {
          setLastConnectionResult(connectionResult);
          return connectionResult;
        }
        
        // Update account name with real data
        if (connectionResult.accountsCount) {
          accountName = `${connectionResult.accountsCount} cuenta(s) de anuncios`;
        }
      } else {
        // Simulate connection delay for other platforms
        await new Promise(resolve => setTimeout(resolve, 1500));
        connectionResult = { success: true };
      }

      const existingIntegration = integrations.find(i => i.platform === platform);

      if (existingIntegration) {
        const { error } = await supabase
          .from('user_integrations')
          .update({
            status: 'connected',
            connected_at: new Date().toISOString(),
            account_name: accountName,
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
            account_name: accountName,
          });

        if (error) throw error;
      }

      await fetchIntegrations();
      setLastConnectionResult(connectionResult);
      return connectionResult;
    } catch (error) {
      console.error('Error connecting platform:', error);
      const result = { success: false, error: 'Error al guardar la conexión' };
      setLastConnectionResult(result);
      return result;
    } finally {
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (platform: string): Promise<boolean> => {
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
      setLastConnectionResult(null);
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
    lastConnectionResult,
    connectPlatform,
    disconnectPlatform,
    getIntegration,
    getConnectedPlatforms,
  };
};
