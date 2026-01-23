import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Calendar, Bot, Plus, Target } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";
import { useProject } from "@/hooks/useProject";
import { useConversations } from "@/hooks/useConversations";
import { Button } from "@/components/ui/button";
import { ProjectGoalsEditor } from "@/components/projects/ProjectGoalsEditor";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { project, loading: projectLoading } = useProject(id);
  const { conversations, loading: conversationsLoading } = useConversations({ projectId: id });

  const handleOpenConversation = (chatId: string) => {
    navigate("/");
    window.dispatchEvent(new CustomEvent("loadConversation", { detail: { chatId } }));
  };

  const handleNewConversation = () => {
    navigate("/");
    window.dispatchEvent(new CustomEvent("newConversation", { detail: { projectId: id } }));
  };

  if (projectLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8 bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8 bg-background">
          <div className="text-center py-12 text-muted-foreground">
            <p>Proyecto no encontrado.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-8 bg-background overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {project.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <ProjectGoalsEditor 
                  projectId={id!} 
                  projectName={project.name}
                  trigger={
                    <Button variant="outline" className="gap-2">
                      <Target size={16} strokeWidth={2} />
                      Metas
                    </Button>
                  }
                />
                <Button onClick={handleNewConversation} className="gap-2">
                  <Plus size={16} strokeWidth={2} />
                  Nueva Conversación
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 ml-7">
              {conversations.length} {conversations.length === 1 ? "conversación" : "conversaciones"}
            </p>
          </div>

          {/* Conversations Grid */}
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
              <MessageSquare size={48} className="mx-auto mb-4 text-zinc-600" />
              <p className="text-muted-foreground mb-4">
                Aún no hay conversaciones en este proyecto.
              </p>
              <Button onClick={handleNewConversation} variant="outline" className="gap-2">
                <Plus size={16} strokeWidth={2} />
                Iniciar primera conversación
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversations.map((convo) => (
                <button
                  key={convo.chat_id}
                  onClick={() => handleOpenConversation(convo.chat_id)}
                  className="text-left p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-700 transition-colors">
                      <MessageSquare size={14} strokeWidth={1.5} className="text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate group-hover:text-white transition-colors">
                        {convo.title || "Sin título"}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bot size={12} strokeWidth={1.5} />
                          Disruptivaa
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} strokeWidth={1.5} />
                          {format(new Date(convo.updated_at), "d MMM", { locale: es })}
                        </span>
                      </div>
                    </div>
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

export default ProjectDetail;
