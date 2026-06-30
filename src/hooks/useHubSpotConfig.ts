import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Campos del lead que el admin puede mapear a HubSpot
export const LEAD_FIELDS: { key: string; label: string; description?: string }[] = [
  { key: "email", label: "Email", description: "Identificador único" },
  { key: "name", label: "Nombre completo", description: "Se divide en firstname + lastname" },
  { key: "phone", label: "Teléfono" },
  { key: "company", label: "Empresa" },
  { key: "website", label: "Sitio web" },
  { key: "service_type", label: "Servicios de interés" },
  { key: "niche", label: "Nicho" },
  { key: "status", label: "Estado del lead" },
  { key: "fit_score", label: "Lead Fit Score" },
  { key: "source", label: "Origen" },
  { key: "notes", label: "Notas internas" },
];

export interface HubSpotConfig {
  id: string;
  enabled: boolean;
  auto_sync: boolean;
  field_mapping: Record<string, string>;
  last_sync_at: string | null;
}

export function useHubSpotConfig() {
  return useQuery({
    queryKey: ["hubspot-config"],
    queryFn: async (): Promise<HubSpotConfig | null> => {
      const { data, error } = await supabase
        .from("hubspot_sync_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as HubSpotConfig | null;
    },
  });
}

export function useUpdateHubSpotConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<HubSpotConfig> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("hubspot_sync_config").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hubspot-config"] }),
  });
}

export function useHubSpotSyncLog() {
  return useQuery({
    queryKey: ["hubspot-sync-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hubspot_sync_log")
        .select("*, leads(email, name)")
        .order("synced_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}
