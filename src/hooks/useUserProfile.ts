import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import i18n from '@/i18n';
import { useEffect } from 'react';

export type SupportedLanguage = 'es' | 'en' | 'pt';

export interface UserProfile {
  id: string;
  language: SupportedLanguage;
  role: string | null;
  company_id: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Try to get existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no profile exists, create one
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newProfile as UserProfile;
      }
      
      return data as UserProfile;
    },
    enabled: !!user,
  });

  // Sync language with i18next when profile loads
  useEffect(() => {
    if (profile?.language && profile.language !== i18n.language) {
      i18n.changeLanguage(profile.language);
    }

    // Auto-detect browser language for new users with default 'es'
    if (profile && profile.language === 'es' && user && !localStorage.getItem('language_synced')) {
      const browserLang = i18n.language?.slice(0, 2) as SupportedLanguage;
      if ((browserLang === 'en' || browserLang === 'pt')) {
        localStorage.setItem('language_synced', 'true');
        supabase
          .from('profiles')
          .update({ language: browserLang })
          .eq('id', user.id)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          });
      } else {
        localStorage.setItem('language_synced', 'true');
      }
    }
  }, [profile?.language]);

  const updateLanguage = useMutation({
    mutationFn: async (language: SupportedLanguage) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ language })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update i18next immediately
      await i18n.changeLanguage(language);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateFullName = useMutation({
    mutationFn: async (fullName: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Update auth metadata
      await supabase.auth.updateUser({ data: { full_name: fullName } });
      
      // Update profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName } as any)
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile,
    isLoading,
    updateLanguage: updateLanguage.mutate,
    isUpdatingLanguage: updateLanguage.isPending,
    updateFullName: updateFullName.mutateAsync,
    isUpdatingFullName: updateFullName.isPending,
  };
};
