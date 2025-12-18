import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const fetchRecentConversations = async () => {
      try {
        // Get the first message of each "conversation" (user messages)
        const { data, error } = await supabase
          .from("agent_messages")
          .select("id, content, created_at")
          .eq("user_id", user.id)
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) throw error;

        // Create conversation summaries from the first user message
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
    };

    fetchRecentConversations();
  }, [user]);

  return { conversations, loading };
};
