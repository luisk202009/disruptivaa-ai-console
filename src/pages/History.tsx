import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Bot, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const History = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("agent_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching history:", error);
      } else {
        setMessages(
          (data || []).map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            created_at: msg.created_at || new Date().toISOString(),
          }))
        );
      }
      setLoading(false);
    };

    fetchMessages();
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-primary" size={28} />
            <h1 className="text-2xl font-bold text-foreground">Historial de Conversaciones</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay conversaciones en el historial.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 p-4 rounded-lg border ${
                    msg.role === "user"
                      ? "bg-card border-border"
                      : "bg-zinc-800 border-2 border-[#EF7911]"
                  }`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {msg.role === "user" ? "Tú" : "Disruptivaa"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(msg.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
