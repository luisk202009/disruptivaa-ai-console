import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProposalTemplate {
  id: string;
  name: string;
  service_type: string;
  html_content: string;
  created_at: string;
}

export const useProposalTemplates = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["proposal-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposal_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as unknown as ProposalTemplate[];
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, name, service_type, html_content }: { id: string; name: string; service_type: string; html_content: string }) => {
      const { error } = await supabase
        .from("proposal_templates")
        .update({ name, service_type, html_content } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-templates"] });
    },
  });

  return { ...query, updateTemplate };
};
