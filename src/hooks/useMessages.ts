import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMessages = () => {
  const [sending, setSending] = useState(false);

  const saveMessage = async (content: string, role: string = "user") => {
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

  return { saveMessage, sending };
};
