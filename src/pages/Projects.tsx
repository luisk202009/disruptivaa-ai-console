import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderKanban, Plus, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";
import { useProjects } from "@/hooks/useProjects";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Button } from "@/components/ui/button";

const dateLocales: Record<string, Locale> = { es, en: enUS, pt: ptBR };

const Projects = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { projects, loading, createProject } = useProjects();
  const [showCreate, setShowCreate] = useState(false);
  const locale = dateLocales[i18n.language] || es;

  const handleCreate = async (name: string, color: string, description?: string) => {
    const project = await createProject(name, color, description);
    if (project) navigate(`/project/${project.id}`);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <FolderKanban size={20} className="text-primary" />
            <h1 className="text-lg font-semibold text-foreground">{t("navigation.projects")}</h1>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} />
            {t("projects.newProject", "Nuevo Proyecto")}
          </Button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                  <FolderKanban size={32} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {t("projects.noProjects", "No tienes proyectos aún")}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {t("projects.noProjectsDesc", "Crea tu primer proyecto para organizar conversaciones y definir objetivos.")}
                </p>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus size={16} />
                  {t("projects.createFirst", "Crear primer proyecto")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="text-left p-5 rounded-xl border border-border bg-card/50 hover:bg-accent/50 hover:border-accent hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: project.color || "#FF7900" }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        {(project as any).description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {(project as any).description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>
                            {t("projects.updatedAgo", "Actualizado")} {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true, locale })}
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

        <CreateProjectDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreateProject={handleCreate}
        />
      </div>
    </div>
  );
};

export default Projects;
