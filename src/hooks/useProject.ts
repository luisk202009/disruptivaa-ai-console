import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "./useProjects";

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching project:", error);
      }
      setProject(data);
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  return { project, loading };
};
