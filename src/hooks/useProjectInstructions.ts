import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProjectInstructions = (projectId: string | undefined) => {
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchInstructions = useCallback(async () => {
    if (!projectId) {
      setInstructions("");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("instructions")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setInstructions((data as any)?.instructions || "");
    } catch (error) {
      console.error("Error fetching instructions:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const saveInstructions = async (text: string): Promise<boolean> => {
    if (!projectId) return false;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ instructions: text } as any)
        .eq("id", projectId);

      if (error) throw error;
      setInstructions(text);
      return true;
    } catch (error) {
      console.error("Error saving instructions:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  return { instructions, setInstructions, saveInstructions, loading, saving };
};
