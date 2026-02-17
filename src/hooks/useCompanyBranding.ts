import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

const DEFAULT_COLOR = '#00A3FF';

export const useCompanyBranding = () => {
  const { profile } = useUserProfile();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company_branding', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('name, branding_color')
        .eq('id', profile.company_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  // Inject CSS variable into <head>
  useEffect(() => {
    const color = company?.branding_color || DEFAULT_COLOR;
    let style = document.getElementById('company-branding') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'company-branding';
      document.head.appendChild(style);
    }
    style.textContent = `:root { --primary-company: ${color}; }`;
    return () => {
      style?.remove();
    };
  }, [company?.branding_color]);

  return {
    companyName: company?.name || null,
    companyColor: company?.branding_color || DEFAULT_COLOR,
    isLoading,
  };
};
