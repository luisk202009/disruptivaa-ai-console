import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  chat_id: string;
  title: string | null;
  user_id: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UseConversationsOptions {
  projectId?: string | null; // null = show only unassigned, undefined = show all
}

export const useConversations = (options: UseConversationsOptions = {}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      // Filter by project
      if (options.projectId === null) {
        query = query.is("project_id", null);
      } else if (options.projectId !== undefined) {
        query = query.eq("project_id", options.projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user, options.projectId]);

  const createConversation = async (
    chatId: string,
    title: string,
    projectId?: string | null
  ): Promise<Conversation | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          chat_id: chatId,
          title: title.length > 50 ? title.substring(0, 50) + "..." : title,
          user_id: user.id,
          project_id: projectId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const updateConversation = async (
    chatId: string,
    updates: { title?: string; project_id?: string | null }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update(updates)
        .eq("chat_id", chatId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating conversation:", error);
      return false;
    }
  };

  const moveConversation = async (chatId: string, projectId: string | null): Promise<boolean> => {
    return updateConversation(chatId, { project_id: projectId });
  };

  const deleteConversation = async (chatId: string): Promise<boolean> => {
    try {
      // Delete messages first
      await supabase
        .from("agent_messages")
        .delete()
        .eq("chat_id", chatId);

      // Then delete conversation
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("chat_id", chatId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchConversations();

    if (!user) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`conversations-${options.projectId ?? 'all'}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("🔄 Realtime conversation update:", payload);
          fetchConversations();
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations, options.projectId]);

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    moveConversation,
    deleteConversation,
    refetch: fetchConversations,
  };
};
