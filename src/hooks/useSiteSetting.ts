import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Hook genérico para leer una entrada de site_settings
export const useSiteSetting = <T = any>(key: string) => {
  return useQuery({
    queryKey: ["site-setting", key],
    queryFn: async (): Promise<T | null> => {
      const { data, error } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      return ((data as any)?.value ?? null) as T | null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Mutación para actualizar (upsert) la configuración. Solo admin por RLS.
export const useUpdateSiteSetting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("site_settings" as any)
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["site-setting", vars.key] });
    },
  });
};

export interface WhatsAppButtonSettings {
  phone: string;
  message: string;
  enabled: boolean;
}

export const WHATSAPP_BUTTON_KEY = "whatsapp_floating_button";
