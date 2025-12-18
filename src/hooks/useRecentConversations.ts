import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecentConversation {
  id: string;
  title: string;
  created_at: string;
}

export const useRecentConversations = () => {
  const [conversations, setConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRecentConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("agent_messages")
        .select("id, content, created_at")
        .eq("user_id", user.id)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const convos: RecentConversation[] = (data || []).map((msg) => ({
        id: msg.id,
        title: msg.content.length > 40 ? msg.content.substring(0, 40) + "..." : msg.content,
        created_at: msg.created_at || "",
      }));

      setConversations(convos);
    } catch (error) {
      console.error("Error fetching recent conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecentConversations();

    if (!user) return;

    // Subscribe to realtime updates for new user messages
    const channel = supabase
      .channel("recent-conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_messages",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMsg = payload.new as { id: string; content: string; created_at: string; role: string };
          
          // Only add user messages to recent conversations
          if (newMsg.role === "user") {
            const newConvo: RecentConversation = {
              id: newMsg.id,
              title: newMsg.content.length > 40 ? newMsg.content.substring(0, 40) + "..." : newMsg.content,
              created_at: newMsg.created_at || "",
            };
            
            setConversations((prev) => [newConvo, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRecentConversations]);

  return { conversations, loading, refetch: fetchRecentConversations };
};
