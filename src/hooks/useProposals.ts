import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Proposal {
  id: string;
  lead_id: string | null;
  title: string;
  slug: string;
  company_name: string;
  html_content: string;
  status: string;
  cta_primary_url: string;
  cta_secondary_url: string;
  created_at: string;
  updated_at: string;
  lead?: { id: string; name: string; email: string; company: string | null } | null;
}

export const useProposals = () => {
  const queryClient = useQueryClient();

  const proposalsQuery = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, lead:leads(id, name, email, company)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Proposal[];
    },
  });

  const createProposal = useMutation({
    mutationFn: async (proposal: { title: string; slug: string; company_name: string; lead_id?: string | null; status?: string; cta_primary_url?: string; cta_secondary_url?: string }) => {
      const { data, error } = await supabase
        .from("proposals")
        .insert({ ...proposal, html_content: "" } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; slug?: string; company_name?: string; lead_id?: string | null; status?: string }) => {
      const { data, error } = await supabase
        .from("proposals")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const deleteProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proposals")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const duplicateProposal = useMutation({
    mutationFn: async (source: Proposal) => {
      const { data, error } = await supabase
        .from("proposals")
        .insert({
          title: `${source.title} (copia)`,
          slug: `${source.slug}-copia`,
          company_name: source.company_name,
          lead_id: source.lead_id,
          status: "draft",
          html_content: "",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  return { proposalsQuery, createProposal, updateProposal, deleteProposal, duplicateProposal };
};
