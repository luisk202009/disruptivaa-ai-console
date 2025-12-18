import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("agent_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error fetching messages:", error);
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
  }, []);

  const saveMessage = async (content: string, role: "user" | "assistant" = "user") => {
    setSending(true);

    const { data, error } = await supabase
      .from("agent_messages")
      .insert({
        content,
        role,
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

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates for new messages
    const channel = supabase
      .channel("agent_messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_messages" },
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
  }, [fetchMessages]);

  return { messages, loading, sending, saveMessage, addLocalMessage, clearMessages, refetch: fetchMessages };
};
