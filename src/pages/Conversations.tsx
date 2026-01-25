import { useNavigate } from "react-router-dom";
import { MessageSquare, Bot, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";
import { useConversations, ConversationWithProject } from "@/hooks/useConversations";

const Conversations = () => {
  const navigate = useNavigate();
  const { conversations, loading } = useConversations() as { 
    conversations: ConversationWithProject[]; 
    loading: boolean 
  };

  const handleOpenConversation = (chatId: string) => {
    navigate("/");
    window.dispatchEvent(new CustomEvent("loadConversation", { detail: { chatId } }));
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="text-primary" size={28} strokeWidth={1.5} />
            <h1 className="text-2xl font-bold text-foreground">Conversaciones</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>No hay conversaciones aún.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((convo) => (
                <button
                  key={convo.chat_id}
                  onClick={() => handleOpenConversation(convo.chat_id)}
                  className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate group-hover:text-white transition-colors">
                        {convo.title || "Sin título"}
                      </h3>
                      <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} strokeWidth={1.5} />
                          {format(new Date(convo.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bot size={12} strokeWidth={1.5} />
                          {convo.agent?.name || "Disruptivaa"}
                        </span>
                      </div>
                    </div>

                    {/* Project Badge */}
                    {convo.project ? (
                      <span 
                        className="text-xs px-2.5 py-1 rounded-full border shrink-0"
                        style={{ 
                          borderColor: convo.project.color,
                          color: convo.project.color 
                        }}
                      >
                        {convo.project.name}
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-500 shrink-0">
                        Sin proyecto
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Conversations;
