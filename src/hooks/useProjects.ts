import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Project {
  id: string;
  name: string;
  color: string;
  description: string | null;
  instructions: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setProjects((data as unknown as Project[]) || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createProject = async (name: string, color: string = '#FF7900', description?: string): Promise<Project | null> => {
    if (!user) return null;

    try {
      const insertData: any = { name, color, user_id: user.id };
      if (description) insertData.description = description;

      const { data, error } = await supabase
        .from("projects")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Project;
    } catch (error) {
      console.error("Error creating project:", error);
      return null;
    }
  };

  const updateProject = async (id: string, updates: { name?: string; color?: string; description?: string; instructions?: string }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("projects")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating project:", error);
      return false;
    }
  };

  const deleteProject = async (id: string, deleteConversations: boolean = false): Promise<boolean> => {
    try {
      if (deleteConversations) {
        const { data: convos } = await supabase
          .from("conversations")
          .select("chat_id")
          .eq("project_id", id);

        if (convos && convos.length > 0) {
          const chatIds = convos.map(c => c.chat_id);
          await supabase.from("agent_messages").delete().in("chat_id", chatIds);
          await supabase.from("conversations").delete().eq("project_id", id);
        }
      }

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();

    if (!user) return;

    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProjects]);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
};
