import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type WhatsAppLinkType = "chat" | "catalog";

export interface WhatsAppLinkAnalyticsRow {
  link_id: string;
  user_id: string | null;
  slug: string;
  phone: string;
  link_type: WhatsAppLinkType;
  is_active: boolean;
  created_at: string;
  total_clicks: number;
  unique_clicks: number;
  last_click_at: string | null;
}

export interface WhatsAppLinkRow {
  id: string;
  user_id: string | null;
  slug: string;
  phone: string;
  message: string | null;
  link_type: WhatsAppLinkType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppLinks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["whatsapp-links", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WhatsAppLinkAnalyticsRow[]> => {
      const { data, error } = await supabase
        .from("whatsapp_link_analytics" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WhatsAppLinkAnalyticsRow[];
    },
  });
};

export const useWhatsAppLink = (id?: string) => {
  return useQuery({
    queryKey: ["whatsapp-link", id],
    enabled: !!id,
    queryFn: async (): Promise<WhatsAppLinkRow | null> => {
      const { data, error } = await supabase
        .from("whatsapp_links")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as WhatsAppLinkRow | null;
    },
  });
};

export const useToggleLinkActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("whatsapp_links")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: ["whatsapp-links"] });
      const prev = qc.getQueriesData<WhatsAppLinkAnalyticsRow[]>({
        queryKey: ["whatsapp-links"],
      });
      prev.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(
          key,
          data.map((l) => (l.link_id === id ? { ...l, is_active: isActive } : l))
        );
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-links"] });
    },
  });
};

export const useDeleteWhatsAppLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["whatsapp-links"] });
    },
  });
};

export interface ClickRow {
  id: string;
  link_id: string;
  clicked_at: string;
  referrer: string | null;
  country: string | null;
  device_type: string | null;
  ip_hash: string | null;
}

export const useWhatsAppLinkClicks = (linkId?: string) => {
  return useQuery({
    queryKey: ["whatsapp-link-clicks", linkId],
    enabled: !!linkId,
    queryFn: async (): Promise<ClickRow[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("whatsapp_link_clicks")
        .select("*")
        .eq("link_id", linkId!)
        .gte("clicked_at", since.toISOString())
        .order("clicked_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as ClickRow[];
    },
  });
};

export const checkSlugAvailable = async (slug: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc("check_slug_available", {
    p_slug: slug,
  });
  if (error) throw error;
  return !!data;
};
