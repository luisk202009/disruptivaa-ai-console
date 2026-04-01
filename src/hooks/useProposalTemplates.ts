import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProposalTemplate {
  id: string;
  name: string;
  service_type: string;
  html_content: string;
  created_at: string;
}

export const useProposalTemplates = () => {
  return useQuery({
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
};
