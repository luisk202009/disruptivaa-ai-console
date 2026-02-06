import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Calendar, Bot, Plus, Target } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";
import { useProject } from "@/hooks/useProject";
import { useConversations } from "@/hooks/useConversations";
import { useProjectGoals, GOAL_METRIC_LABELS, formatGoalValue, GOAL_PERIOD_LABELS } from "@/hooks/useProjectGoals";
import { Button } from "@/components/ui/button";
import { ProjectGoalsEditor } from "@/components/projects/ProjectGoalsEditor";
import { ProjectHealthCard } from "@/components/projects/ProjectHealthCard";
import { Card, CardContent } from "@/components/ui/card";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { project, loading: projectLoading } = useProject(id);
  const { conversations, loading: conversationsLoading } = useConversations({ projectId: id });
  const { goals, loading: goalsLoading } = useProjectGoals({ projectId: id });

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
        <div className="max-w-7xl mx-auto">
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

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Conversations (2/3) */}
            <section className="lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                <MessageSquare size={18} className="text-muted-foreground" />
                Conversaciones del Proyecto
              </h2>
              
              {conversationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Aún no hay conversaciones en este proyecto.
                  </p>
                  <Button onClick={handleNewConversation} variant="outline" className="gap-2">
                    <Plus size={16} strokeWidth={2} />
                    Iniciar primera conversación
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {conversations.map((convo) => (
                    <button
                      key={convo.chat_id}
                      onClick={() => handleOpenConversation(convo.chat_id)}
                      className="text-left p-5 rounded-xl border border-border bg-card/50 hover:bg-accent/50 hover:border-accent transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-accent transition-colors">
                          <MessageSquare size={14} strokeWidth={1.5} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate group-hover:text-accent-foreground transition-colors">
                            {convo.title || "Sin título"}
                          </h3>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Bot size={12} strokeWidth={1.5} />
                              {convo.agent?.name || "Disruptivaa"}
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
            </section>

            {/* Right Column: Health & Goals Panel (1/3) */}
            <aside className="space-y-6">
              {/* Project Health Status */}
              <ProjectHealthCard 
                projectId={id!}
                projectColor={project.color || "#FF7900"}
              />

              {/* Active Goals Summary */}
              {!goalsLoading && goals.length > 0 && (
                <Card className="border-border bg-card">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Target size={14} className="text-primary" />
                      Objetivos Activos
                    </h3>
                    <div className="space-y-2">
                      {goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="p-3 rounded-lg border border-border bg-card/50"
                          style={{ borderLeftColor: project.color, borderLeftWidth: 3 }}
                        >
                          <p className="text-xs text-muted-foreground">
                            {GOAL_METRIC_LABELS[goal.metric_key]}
                          </p>
                          <div className="flex items-baseline justify-between mt-1">
                            <p className="text-lg font-bold text-foreground">
                              {formatGoalValue(goal)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {GOAL_PERIOD_LABELS[goal.period]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty state for goals */}
              {!goalsLoading && goals.length === 0 && (
                <Card className="border-border bg-card border-dashed">
                  <CardContent className="p-6 text-center">
                    <Target size={32} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Sin objetivos definidos
                    </p>
                    <ProjectGoalsEditor 
                      projectId={id!} 
                      projectName={project.name}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-2">
                          <Plus size={14} strokeWidth={2} />
                          Definir Meta
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;
