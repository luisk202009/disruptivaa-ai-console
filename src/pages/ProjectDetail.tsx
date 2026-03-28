import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Calendar, Bot, Plus, Target, RefreshCw, FileText, Upload, Trash2, Save, FileIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { useProject } from "@/hooks/useProject";
import { useConversations } from "@/hooks/useConversations";
import { useProjectGoals, GOAL_METRIC_LABELS, formatGoalValue, GOAL_PERIOD_LABELS } from "@/hooks/useProjectGoals";
import { useGoalMetrics } from "@/hooks/useGoalMetrics";
import { useProjectInstructions } from "@/hooks/useProjectInstructions";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProjectGoalsEditor } from "@/components/projects/ProjectGoalsEditor";
import { ProjectHealthCard } from "@/components/projects/ProjectHealthCard";
import { ProjectExportDialog } from "@/components/projects/ProjectExportDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const ACCEPTED_FILE_TYPES = ".pdf,.md,.txt,.xlsx,.csv,.docx";

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { project, loading: projectLoading } = useProject(id);
  const { conversations, loading: conversationsLoading } = useConversations({ projectId: id });
  const { goals, loading: goalsLoading } = useProjectGoals({ projectId: id });
  const { metricsData, loading: metricsLoading, refreshing: metricsRefreshing, refresh, isDemo } = useGoalMetrics(goals);
  const { instructions, setInstructions, saveInstructions, saving } = useProjectInstructions(id);
  const { files, uploadFile, deleteFile } = useProjectFiles(id);

  const handleOpenConversation = (chatId: string) => {
    navigate("/agents");
    window.dispatchEvent(new CustomEvent("loadConversation", { detail: { chatId } }));
  };

  const handleNewConversation = () => {
    navigate("/agents");
    window.dispatchEvent(new CustomEvent("newConversation", { detail: { projectId: id } }));
  };

  const handleRefreshMetrics = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleSaveInstructions = async () => {
    const ok = await saveInstructions(instructions);
    if (ok) {
      toast({ title: t("projects.instructionsSaved", "Instrucciones guardadas") });
    } else {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setUploading(true);
    for (const file of Array.from(selectedFiles)) {
      await uploadFile(file);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: t("projects.filesUploaded", "Archivos subidos") });
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    await deleteFile(fileId, filePath);
    toast({ title: t("projects.fileDeleted", "Archivo eliminado") });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;
    setUploading(true);
    for (const file of droppedFiles) {
      await uploadFile(file);
    }
    setUploading(false);
    toast({ title: t("projects.filesUploaded", "Archivos subidos") });
  };

  if (projectLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8 bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
            <p>{t("projectDetail.notFound")}</p>
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
          {/* Back button */}
          <button
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            {t("navigation.projects")}
          </button>

          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    {project.name}
                  </h1>
                  {(project as any).description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {(project as any).description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setExportOpen(true)} className="gap-2" disabled={goalsLoading}>
                  <FileText size={16} />
                  {t("projectExport.title")}
                </Button>
                <Button variant="outline" onClick={handleRefreshMetrics} disabled={refreshing} className="gap-2">
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? t("projectDetail.refreshing") : t("projectDetail.refreshData")}
                </Button>
                <ProjectGoalsEditor
                  projectId={id!}
                  projectName={project.name}
                  trigger={
                    <Button variant="outline" className="gap-2">
                      <Target size={16} strokeWidth={2} />
                      {t("projectDetail.goals")}
                    </Button>
                  }
                />
                <Button onClick={handleNewConversation} className="gap-2">
                  <Plus size={16} strokeWidth={2} />
                  {t("projectDetail.newConversation")}
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="bg-transparent border-b border-white/[0.06] rounded-none w-full justify-start h-auto p-0 mb-6">
              <TabsTrigger
                value="instructions"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-300 px-4 py-3 text-sm font-medium transition-colors"
              >
                {t("projects.instructions", "Instrucciones")}
              </TabsTrigger>
              <TabsTrigger
                value="conversations"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-300 px-4 py-3 text-sm font-medium transition-colors"
              >
                {t("projects.conversations", "Conversaciones")} ({conversations.length})
              </TabsTrigger>
            </TabsList>

            {/* Instructions Tab */}
            <TabsContent value="instructions" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Instructions Editor */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">
                    {t("projects.instructions", "Instrucciones")}
                  </h3>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder={t("projects.instructionsPlaceholder", "Agrega contexto sobre este proyecto: cliente, objetivos, estrategia, restricciones de marca, tono de comunicación...")}
                    className="min-h-[300px] bg-card border-border text-foreground resize-y"
                  />
                  <Button onClick={handleSaveInstructions} disabled={saving} className="gap-2">
                    <Save size={16} />
                    {saving ? t("common.saving") : t("projects.saveInstructions", "Guardar instrucciones")}
                  </Button>
                </div>

                {/* Knowledge Base / Files */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">
                    {t("projects.knowledgeBase", "Base de Conocimiento")}
                  </h3>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("projects.dropFiles", "Arrastra archivos aquí o haz clic para seleccionar")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("projects.acceptedFormats", "PDF, MD, TXT, XLSX, CSV, DOCX")}
                    </p>
                    {uploading && (
                      <div className="mt-3">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Files list */}
                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50"
                        >
                          <FileIcon size={16} className="text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteFile(file.id, file.file_path)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("projects.noFiles", "No hay archivos adjuntos")}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {t("projects.filesHelp", "Los archivos subidos estarán disponibles como contexto para los agentes AI en este proyecto")}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2">
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border rounded-xl">
                      <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">{t("projectDetail.noConversations")}</p>
                      <Button onClick={handleNewConversation} variant="outline" className="gap-2">
                        <Plus size={16} strokeWidth={2} />
                        {t("projectDetail.startFirst")}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {conversations.map((convo) => (
                        <button
                          key={convo.chat_id}
                          onClick={() => handleOpenConversation(convo.chat_id)}
                          className="text-left p-4 rounded-xl border border-border bg-card/50 hover:bg-accent/50 hover:border-accent transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <MessageSquare size={14} strokeWidth={1.5} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground truncate text-sm">
                                {convo.title || t("sidebar.untitled")}
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

                {/* Right Column: Health & Goals */}
                <aside className="space-y-6">
                  <ProjectHealthCard
                    projectId={id!}
                    projectColor={project.color || "#FF7900"}
                    goals={goals}
                    metricsData={metricsData}
                    metricsLoading={metricsLoading}
                    refreshing={metricsRefreshing}
                    isDemo={isDemo}
                    onRefresh={handleRefreshMetrics}
                  />

                  {!goalsLoading && goals.length > 0 && (
                    <Card className="border-border bg-card">
                      <CardContent className="p-4 space-y-3">
                        <h3 className="text-sm font-medium flex items-center gap-2 text-foreground">
                          <Target size={14} className="text-primary" />
                          {t("projectHealth.activeGoals")}
                        </h3>
                        <div className="space-y-2">
                          {goals.map((goal) => (
                            <div
                              key={goal.id}
                              className="p-3 rounded-lg border border-border bg-card/50"
                              style={{ borderLeftColor: project.color, borderLeftWidth: 3 }}
                            >
                              <p className="text-xs text-muted-foreground">{GOAL_METRIC_LABELS[goal.metric_key]}</p>
                              <div className="flex items-baseline justify-between mt-1">
                                <p className="text-lg font-bold text-foreground">{formatGoalValue(goal)}</p>
                                <p className="text-xs text-muted-foreground">{GOAL_PERIOD_LABELS[goal.period]}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!goalsLoading && goals.length === 0 && (
                    <Card className="border-border bg-card border-dashed">
                      <CardContent className="p-6 text-center">
                        <Target size={32} className="mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-3">{t("projectHealth.noGoals")}</p>
                        <ProjectGoalsEditor
                          projectId={id!}
                          projectName={project.name}
                          trigger={
                            <Button variant="outline" size="sm" className="gap-2">
                              <Plus size={14} strokeWidth={2} />
                              {t("projectHealth.defineGoal")}
                            </Button>
                          }
                        />
                      </CardContent>
                    </Card>
                  )}
                </aside>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <ProjectExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          projectName={project.name}
          goals={goals}
          metricsData={metricsData}
          isDemo={isDemo}
        />
      </main>
    </div>
  );
};

export default ProjectDetail;
