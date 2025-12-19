import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching messages:", error);
      setLoading(false);
      return;
    }

    setMessages(
      (data || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        created_at: msg.created_at || new Date().toISOString(),
      }))
    );
    setLoading(false);
  }, [user]);

  const saveMessage = async (content: string, role: "user" | "assistant" = "user") => {
    if (!user) {
      console.error("Cannot save message: user not authenticated");
      return null;
    }

    setSending(true);

    const { data, error } = await supabase
      .from("agent_messages")
      .insert({
        content,
        role,
        user_id: user.id,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      console.error("Error saving message:", error);
      return null;
    }

    return data;
  };

  const addLocalMessage = (message: Omit<Message, "id" | "created_at">) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time updates for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("agent_messages_realtime")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "agent_messages",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log("New message received:", payload);
          const newMsg = payload.new as any;
          
          // Add new message if it doesn't exist locally
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;
            
            return [
              ...prev,
              {
                id: newMsg.id,
                role: newMsg.role as "user" | "assistant",
                content: newMsg.content,
                created_at: newMsg.created_at || new Date().toISOString(),
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { messages, loading, sending, saveMessage, addLocalMessage, clearMessages, refetch: fetchMessages };
};
