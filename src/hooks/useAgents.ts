import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "completed" | "error";
  last_action: string | null;
}

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching agents:", error);
      return;
    }

    setAgents(
      (data || []).map((agent) => ({
        ...agent,
        status: (agent.status as Agent["status"]) || "idle",
      }))
    );
    setLoading(false);
  };

  const updateAgentStatus = async (
    agentId: string,
    status: Agent["status"],
    lastAction?: string
  ) => {
    // Optimistic update
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, status, last_action: lastAction || a.last_action }
          : a
      )
    );

    const { error } = await supabase
      .from("ai_agents")
      .update({
        status,
        last_action: lastAction,
      })
      .eq("id", agentId);

    if (error) {
      console.error("Error updating agent:", error);
      fetchAgents(); // Revert on error
    }
  };

  useEffect(() => {
    fetchAgents();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("ai_agents_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_agents" },
        () => fetchAgents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { agents, loading, updateAgentStatus, refetch: fetchAgents };
};
