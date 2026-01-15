import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Project {
  id: string;
  name: string;
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
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createProject = async (name: string): Promise<Project | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating project:", error);
      return null;
    }
  };

  const updateProject = async (id: string, name: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ name })
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
        // First delete all conversations in this project (messages will cascade)
        const { data: convos } = await supabase
          .from("conversations")
          .select("chat_id")
          .eq("project_id", id);

        if (convos && convos.length > 0) {
          const chatIds = convos.map(c => c.chat_id);
          
          // Delete messages first
          await supabase
            .from("agent_messages")
            .delete()
            .in("chat_id", chatIds);
          
          // Then delete conversations
          await supabase
            .from("conversations")
            .delete()
            .eq("project_id", id);
        }
      }
      // If not deleteConversations, the FK ON DELETE SET NULL will handle it

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

    // Subscribe to realtime updates
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
