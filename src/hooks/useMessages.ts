import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  chat_id?: string;
}

export const useMessages = (chatId?: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Add message optimistically to local state
  const addOptimisticMessage = useCallback((content: string, role: "user" | "assistant", messageChatId?: string) => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      role,
      content,
      created_at: new Date().toISOString(),
      chat_id: messageChatId || chatId || undefined,
    };
    setMessages((prev) => [...prev, tempMessage]);
    return tempMessage;
  }, [chatId]);

  // Add error message to chat
  const addErrorMessage = useCallback((errorText: string) => {
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      role: "assistant",
      content: errorText,
      created_at: new Date().toISOString(),
      chat_id: chatId || undefined,
    };
    setMessages((prev) => [...prev, errorMessage]);
    return errorMessage;
  }, [chatId]);

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("agent_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    // Filter by chat_id if provided
    if (chatId) {
      query = query.eq("chat_id", chatId);
    }

    const { data, error } = await query;

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
        chat_id: msg.chat_id,
      }))
    );
    setLoading(false);
  }, [user, chatId]);

  const saveMessage = async (content: string, role: "user" | "assistant" = "user", messageChatId?: string) => {
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
        chat_id: messageChatId || chatId || undefined,
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

    // Build filter based on chat_id
    let filter = `user_id=eq.${user.id}`;
    if (chatId) {
      filter += `,chat_id=eq.${chatId}`;
    }

    const channel = supabase
      .channel(`agent_messages_realtime_${chatId || "all"}`)
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
          
          // Only add if matches current chat_id (or if no chat_id filter)
          if (chatId && newMsg.chat_id !== chatId) {
            return;
          }
          
          // Add new message if it doesn't exist locally, replace temp messages
          setMessages((prev) => {
            // Check if this message already exists by ID
            const existsById = prev.some((m) => m.id === newMsg.id);
            if (existsById) return prev;
            
            // Check if there's a temp message with same content and role to replace
            const tempIndex = prev.findIndex((m) => 
              m.id.startsWith('temp-') && 
              m.content === newMsg.content && 
              m.role === newMsg.role
            );
            
            if (tempIndex !== -1) {
              // Replace temp message with real one
              const updated = [...prev];
              updated[tempIndex] = {
                id: newMsg.id,
                role: newMsg.role as "user" | "assistant",
                content: newMsg.content,
                created_at: newMsg.created_at || new Date().toISOString(),
                chat_id: newMsg.chat_id,
              };
              return updated;
            }
            
            return [
              ...prev,
              {
                id: newMsg.id,
                role: newMsg.role as "user" | "assistant",
                content: newMsg.content,
                created_at: newMsg.created_at || new Date().toISOString(),
                chat_id: newMsg.chat_id,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatId]);

  return { messages, loading, sending, saveMessage, addLocalMessage, addOptimisticMessage, addErrorMessage, clearMessages, refetch: fetchMessages };
};
