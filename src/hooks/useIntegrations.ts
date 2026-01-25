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
  access_token?: string | null;
}

export interface ConnectionResult {
  success: boolean;
  accountsCount?: number;
  accountDetails?: MetaAccountDetail[];
  accountIds?: string[];
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
        access_token: (item as any).access_token || null,
      })) || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate Meta token via edge function (receives token as parameter)
  const validateMetaConnection = async (accessToken: string): Promise<ConnectionResult> => {
    try {
      console.log('🔄 Validating Meta connection with user token...');
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      const data = await response.json();
      console.log('📥 Validation response:', data);

      if (data.success) {
        return {
          success: true,
          accountsCount: data.accounts,
          accountDetails: data.accountDetails,
          accountIds: data.accountIds,
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

  // Connect Meta Ads with user-provided token (multi-tenant)
  const connectMetaAds = async (accessToken: string): Promise<ConnectionResult> => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    setConnecting('meta_ads');

    try {
      // 1. Validate token against Meta API
      const validationResult = await validateMetaConnection(accessToken);
      
      if (!validationResult.success) {
        setLastConnectionResult(validationResult);
        return validationResult;
      }

      // 2. Save token and connection info to database (protected by RLS)
      const accountName = validationResult.accountsCount 
        ? `${validationResult.accountsCount} cuenta(s) de anuncios`
        : 'Meta Ads';

      const existingIntegration = integrations.find(i => i.platform === 'meta_ads');

      const integrationData = {
        user_id: user.id,
        platform: 'meta_ads',
        status: 'connected',
        connected_at: new Date().toISOString(),
        account_name: accountName,
        access_token: accessToken,
        account_ids: validationResult.accountIds || [],
      };

      if (existingIntegration) {
        const { error } = await supabase
          .from('user_integrations')
          .update(integrationData)
          .eq('id', existingIntegration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_integrations')
          .insert(integrationData);

        if (error) throw error;
      }

      await fetchIntegrations();
      setLastConnectionResult(validationResult);
      return validationResult;
    } catch (error) {
      console.error('Error connecting Meta Ads:', error);
      const result = { success: false, error: 'Error al guardar la conexión' };
      setLastConnectionResult(result);
      return result;
    } finally {
      setConnecting(null);
    }
  };

  // Connect other platforms (demo mode)
  const connectPlatform = async (platform: string): Promise<ConnectionResult> => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    // For Meta Ads, this function should not be called directly
    // Use connectMetaAds instead with the token
    if (platform === 'meta_ads') {
      return { success: false, error: 'Usa connectMetaAds para conectar Meta Ads' };
    }

    setConnecting(platform);

    try {
      // Simulate connection delay for demo platforms
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const accountName = PLATFORM_ACCOUNTS[platform];
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
      const result: ConnectionResult = { success: true };
      setLastConnectionResult(result);
      return result;
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
          access_token: null,
          account_ids: null,
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

  // Get user's Meta token from database
  const getUserMetaToken = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('platform', 'meta_ads')
        .eq('status', 'connected')
        .maybeSingle();

      if (error) throw error;
      return (data as any)?.access_token || null;
    } catch (error) {
      console.error('Error fetching Meta token:', error);
      return null;
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

  // Fetch Meta account details from the database
  const getMetaAccountDetails = async (): Promise<MetaAccountDetail[]> => {
    return getAccountDetailsByPlatform('meta_ads');
  };

  // Generic function to fetch account details by platform
  const getAccountDetailsByPlatform = async (platform: 'meta_ads' | 'google_ads' | 'tiktok_ads'): Promise<MetaAccountDetail[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('account_ids, account_name')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('status', 'connected')
        .maybeSingle();

      if (error || !data?.account_ids?.length) {
        // Return demo accounts for Google and TikTok if not connected
        if (platform === 'google_ads') {
          return [
            { id: 'demo-google-1', name: 'Google Ads Demo Account', status: 'demo' },
          ];
        }
        if (platform === 'tiktok_ads') {
          return [
            { id: 'demo-tiktok-1', name: 'TikTok Ads Demo Account', status: 'demo' },
          ];
        }
        return [];
      }

      // For Meta, fetch from edge function
      if (platform === 'meta_ads') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const response = await fetch(
          "https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/fetch-meta-accounts",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ account_ids: data.account_ids }),
          }
        );

        if (!response.ok) {
          return data.account_ids.map((id: string) => ({
            id,
            name: `Cuenta ${id}`,
            status: "active",
          }));
        }

        const result = await response.json();
        return result.accounts || [];
      }

      // For Google/TikTok, return stored IDs with generic names
      return data.account_ids.map((id: string, index: number) => ({
        id,
        name: data.account_name || `${platform === 'google_ads' ? 'Google' : 'TikTok'} Account ${index + 1}`,
        status: "active",
      }));
    } catch (error) {
      console.error(`Error fetching ${platform} account details:`, error);
      return [];
    }
  };

  return {
    integrations,
    loading,
    connecting,
    lastConnectionResult,
    connectPlatform,
    connectMetaAds,
    disconnectPlatform,
    getIntegration,
    getConnectedPlatforms,
    getUserMetaToken,
    getMetaAccountDetails,
    getAccountDetailsByPlatform,
  };
};
