import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RecentConversation {
  id: string;
  chat_id: string;
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
      // Fetch distinct chat_ids with their first user message
      const { data, error } = await supabase
        .from("agent_messages")
        .select("id, content, created_at, chat_id")
        .eq("user_id", user.id)
        .eq("role", "user")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by chat_id and take the first (oldest) message as title
      const chatIdMap = new Map<string, { id: string; content: string; created_at: string }>();
      
      // Since we ordered by desc, we iterate in reverse to get the oldest message first for each chat_id
      const reversedData = [...(data || [])].reverse();
      
      for (const msg of reversedData) {
        if (msg.chat_id && !chatIdMap.has(msg.chat_id)) {
          chatIdMap.set(msg.chat_id, {
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at || "",
          });
        }
      }

      // Convert to array and sort by most recent
      const convos: RecentConversation[] = [];
      for (const [chatId, msgData] of chatIdMap.entries()) {
        convos.push({
          id: msgData.id,
          chat_id: chatId,
          title: msgData.content.length > 40 ? msgData.content.substring(0, 40) + "..." : msgData.content,
          created_at: msgData.created_at,
        });
      }

      // Sort by created_at descending (most recent first), limit to 10
      convos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setConversations(convos.slice(0, 10));
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
          const newMsg = payload.new as { id: string; content: string; created_at: string; role: string; chat_id: string };
          
          // Only process user messages
          if (newMsg.role === "user" && newMsg.chat_id) {
            // Check if this chat_id already exists
            setConversations((prev) => {
              const existingIndex = prev.findIndex(c => c.chat_id === newMsg.chat_id);
              
              if (existingIndex === -1) {
                // New conversation - add to top
                const newConvo: RecentConversation = {
                  id: newMsg.id,
                  chat_id: newMsg.chat_id,
                  title: newMsg.content.length > 40 ? newMsg.content.substring(0, 40) + "..." : newMsg.content,
                  created_at: newMsg.created_at || "",
                };
                return [newConvo, ...prev.slice(0, 9)];
              }
              
              // Existing conversation - move to top but keep original title
              const existing = prev[existingIndex];
              const updated = prev.filter((_, i) => i !== existingIndex);
              return [{ ...existing, created_at: newMsg.created_at || existing.created_at }, ...updated.slice(0, 9)];
            });
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
