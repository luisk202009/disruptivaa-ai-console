import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Campos del lead que el admin puede mapear a HubSpot
export const LEAD_FIELDS: { key: string; label: string; description?: string; defaultObject: "contact" | "company" }[] = [
  { key: "email",        label: "Email",              description: "Identificador único del contacto", defaultObject: "contact" },
  { key: "name",         label: "Nombre completo",    description: "Se divide en firstname + lastname", defaultObject: "contact" },
  { key: "phone",        label: "Teléfono",           defaultObject: "contact" },
  { key: "company",      label: "Empresa / Despacho", description: "Crea/actualiza la Empresa en HubSpot", defaultObject: "company" },
  { key: "website",      label: "Sitio web",          description: "Propiedad de Empresa (dominio)",     defaultObject: "company" },
  { key: "service_type", label: "Servicios de interés", defaultObject: "contact" },
  { key: "niche",        label: "Nicho",              defaultObject: "contact" },
  { key: "status",       label: "Estado del lead",    description: "Se transforma a lifecyclestage", defaultObject: "contact" },
  { key: "fit_score",    label: "Lead Fit Score",     defaultObject: "contact" },
  { key: "source",       label: "Origen",             defaultObject: "contact" },
  { key: "notes",        label: "Notas internas",     defaultObject: "contact" },
];

export type ObjectType = "contact" | "company";
export interface MappingEntry {
  property: string;
  object: ObjectType;
}

export interface HubSpotConfig {
  id: string;
  enabled: boolean;
  auto_sync: boolean;
  field_mapping: Record<string, MappingEntry | string>;
  last_sync_at: string | null;
}

// Normaliza posibles formatos antiguos
export function normalizeMappingClient(raw: Record<string, MappingEntry | string> | null | undefined): Record<string, MappingEntry> {
  const out: Record<string, MappingEntry> = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (!v) continue;
    if (typeof v === "string") {
      if (v === "__none__") continue;
      out[k] = { property: v, object: "contact" };
    } else if (v.property) {
      out[k] = { property: v.property, object: v.object || "contact" };
    }
  }
  return out;
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
      const { error } = await supabase.from("hubspot_sync_config").update(rest as any).eq("id", id);
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
