import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, LogOut, Search, X, MessageSquare, Folder, FolderOpen, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { DISRUPTIVAA_AGENTS, DisruptivaaAgent } from "@/components/agentDefinitions";
import CommandConsole from "@/components/CommandConsole";
import AgentActivityTimeline from "@/components/AgentActivityTimeline";
import AuthModal from "@/components/AuthModal";
import Sidebar from "@/components/Sidebar";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/hooks/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useProjects } from "@/hooks/useProjects";
import { useConversations } from "@/hooks/useConversations";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { ProjectItemMenu } from "@/components/ProjectItemMenu";
import { ConversationItemMenu } from "@/components/ConversationItemMenu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const Agents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(["common", "agents"]);
  const { user, signOut } = useAuth();
  const { agents, loading, updateAgentStatus } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DisruptivaaAgent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // History tab state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);

  const { clearMessages } = useMessages(activeChatId);
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects();
  const {
    conversations,
    loading: conversationsLoading,
    loadingMore,
    hasMore,
    loadMore,
    deleteConversation,
    moveConversation,
  } = useConversations(
    selectedProjectId !== undefined ? { projectId: selectedProjectId } : {}
  );

  const generateChatId = useCallback(() => crypto.randomUUID(), []);

  // Filtered data
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(convo => convo.title?.toLowerCase().includes(query));
  }, [conversations, searchQuery]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(project => project.name.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  const [activeTab, setActiveTab] = useState("gallery");

  // Check if redirected with agent pre-selected or openCreateProject
  useEffect(() => {
    if (location.state?.openCreateProject) {
      setActiveTab("history");
      setShowCreateProject(true);
      window.history.replaceState({}, document.title);
    } else if (location.state?.selectedAgentId) {
      const agent = DISRUPTIVAA_AGENTS.find(a => a.id === location.state.selectedAgentId);
      if (agent) {
        setSelectedAgent(agent);
        toast({
          title: t("dashboard.agentSelectedTitle", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
          description: t("dashboard.agentSelectedDesc", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
        });
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleNewConversation = () => {
      setSelectedAgent(null);
      setIsChatActive(false);
      setActiveChatId(null);
      clearMessages();
    };
    window.addEventListener("newConversation", handleNewConversation);
    return () => window.removeEventListener("newConversation", handleNewConversation);
  }, [clearMessages]);

  useEffect(() => {
    const handleLoadConversation = (e: CustomEvent<{ chatId: string }>) => {
      const { chatId } = e.detail;
      setActiveChatId(chatId);
      setIsChatActive(true);
      setSelectedAgent(null);
    };
    window.addEventListener("loadConversation", handleLoadConversation as EventListener);
    return () => window.removeEventListener("loadConversation", handleLoadConversation as EventListener);
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      setSelectedAgent(null);
      setIsChatActive(false);
      setActiveChatId(null);
      clearMessages();
    };
    window.addEventListener("userLoggedOut", handleLogout);
    return () => window.removeEventListener("userLoggedOut", handleLogout);
  }, [clearMessages]);

  const handleSelectAgent = (agent: DisruptivaaAgent) => {
    if (!user) { setShowAuthModal(true); return; }
    setSelectedAgent(agent);
    const newChatId = generateChatId();
    setActiveChatId(newChatId);
    toast({
      title: t("dashboard.agentSelectedTitle", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
      description: t("dashboard.agentSelectedDesc", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
    });
  };

  const handleConsoleFocus = () => {
    if (!user) { setShowAuthModal(true); return true; }
    return false;
  };

  const handleClearAgent = () => {
    setSelectedAgent(null);
    setIsChatActive(false);
    setActiveChatId(null);
  };

  const handleCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    setIsChatActive(true);
    if (!activeChatId) setActiveChatId(generateChatId());

    if (!selectedAgent) {
      for (const agent of DISRUPTIVAA_AGENTS) {
        const matches = agent.keywords.some((kw) => lowerCommand.includes(kw));
        if (matches) {
          setSelectedAgent(agent);
          toast({
            title: t("dashboard.agentDetected", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
            description: t("common.loading"),
          });
          break;
        }
      }
    }

    const dbAgent = agents.find(a =>
      a.name.toLowerCase().includes(selectedAgent?.name.toLowerCase().split(' ')[0] || '') ||
      selectedAgent?.keywords.some(kw => a.name.toLowerCase().includes(kw))
    );
    if (dbAgent) {
      await updateAgentStatus(dbAgent.id, "working", `Procesando: "${command}"`);
      setTimeout(async () => {
        await updateAgentStatus(dbAgent.id, "completed", `Completado: "${command}"`);
      }, 5000);
    }
  };

  const handleLoadConversation = (chatId: string) => {
    setActiveChatId(chatId);
    setIsChatActive(true);
    setSelectedAgent(null);
  };

  const handleCreateProject = async (name: string, color: string) => {
    await createProject(name, color);
  };

  const handleRenameProject = async (id: string, name: string, color: string) => {
    await updateProject(id, { name, color });
  };

  const handleDeleteProject = async (id: string, deleteConvos: boolean) => {
    await deleteProject(id, deleteConvos);
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const handleDeleteConversation = async (chatId: string) => {
    await deleteConversation(chatId);
  };

  const handleMoveConversation = async (chatId: string, projectId: string | null) => {
    await moveConversation(chatId, projectId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-foreground">{t("agents.title")}</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <button onClick={signOut} className="p-2 rounded-lg hover:bg-muted transition-colors" title={t("navigation.signOut")}>
                  <LogOut size={18} className="text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button onClick={() => navigate("/auth")} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                {t("auth.signIn")}
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className={cn(
          "flex-1 p-6 overflow-hidden flex flex-col",
          isChatActive ? "min-h-0" : "overflow-auto"
        )}>
          <div className={cn(
            "mx-auto w-full",
            isChatActive ? "max-w-4xl flex-1 flex flex-col min-h-0" : "max-w-6xl"
          )}>
            {/* Welcome section with Tabs - Hidden when chat is active */}
            {!isChatActive && (
              <div className="animate-fade-in">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-transparent border-b border-white/[0.06] rounded-none w-full justify-start h-auto p-0 mb-8">
                    <TabsTrigger
                      value="gallery"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary-company,#00A3FF)] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-300 px-4 py-3 text-sm font-medium transition-colors"
                    >
                      {t("agents.tabGallery")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary-company,#00A3FF)] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-300 px-4 py-3 text-sm font-medium transition-colors"
                    >
                      {t("agents.tabHistory")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--primary-company,#00A3FF)] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-zinc-500 hover:text-zinc-300 px-4 py-3 text-sm font-medium transition-colors"
                    >
                      {t("agents.tabActivity")}
                    </TabsTrigger>
                  </TabsList>

                  {/* Gallery Tab */}
                  <TabsContent value="gallery" className="mt-0">
                    <div className="text-center pt-8 pb-6">
                      <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                        {t("agents.welcomePrompt")}
                      </h2>
                    </div>

                    <div className="mb-8">
                      <CommandConsole
                        onCommand={handleCommand}
                        selectedAgent={selectedAgent}
                        onClearAgent={handleClearAgent}
                        onAuthRequired={handleConsoleFocus}
                        isAuthenticated={!!user}
                        chatId={activeChatId}
                        onChatIdGenerated={(id) => setActiveChatId(id)}
                        autoFocus
                        showMessages={false}
                      />
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground">{t("agents.selectPrompt")}</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {DISRUPTIVAA_AGENTS.map((agent) => {
                        const Icon = agent.icon;
                        const isSelected = selectedAgent?.id === agent.id;
                        return (
                          <button
                            key={agent.id}
                            onClick={() => handleSelectAgent(agent)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
                              "hover:border-white/[0.15] hover:bg-muted/50",
                              isSelected ? "border-primary bg-primary/10" : "border-white/[0.06] bg-card"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                              isSelected ? "bg-primary/20" : "bg-muted"
                            )}>
                              <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <div className="text-left">
                              <p className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>
                                {t(`${agent.id}.name`, { ns: "agents" })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t(`${agent.id}.description`, { ns: "agents" })}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history" className="mt-0">
                    {/* Search */}
                    <div className="mb-6 max-w-md">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t("sidebar.searchConversations")}
                          className="w-full pl-9 pr-8 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04] transition-all duration-200"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Projects */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => setProjectsExpanded(!projectsExpanded)}
                          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          {projectsExpanded ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                          {t("navigation.projects")}
                        </button>
                        <button
                          onClick={() => setShowCreateProject(true)}
                          className="p-1.5 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-200 transition-colors"
                        >
                          <Plus size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      {projectsExpanded && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedProjectId(null)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                              selectedProjectId === null ? "text-foreground bg-white/[0.06]" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                            )}
                          >
                            <FolderOpen size={14} strokeWidth={1.5} />
                            <span>General</span>
                          </button>
                          {projectsLoading ? (
                            <p className="text-xs text-muted-foreground px-3 py-2">{t("common.loading")}</p>
                          ) : (
                            filteredProjects.map((project) => (
                              <div key={project.id} className="flex items-center group">
                                <button
                                  onClick={() => setSelectedProjectId(project.id)}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                    selectedProjectId === project.id ? "text-foreground bg-white/[0.06]" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                                  )}
                                >
                                  <Folder size={14} strokeWidth={1.5} style={{ color: project.color }} />
                                  <span>{project.name}</span>
                                </button>
                                <ProjectItemMenu project={project} onRename={handleRenameProject} onDelete={handleDeleteProject} />
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Conversations */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={14} strokeWidth={1.5} className="text-zinc-500" />
                        <span className="text-sm text-zinc-400">{t("navigation.recentConversations")}</span>
                      </div>

                      {conversationsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 size={20} className="animate-spin text-zinc-500" />
                        </div>
                      ) : filteredConversations.length === 0 ? (
                        <p className="text-sm text-zinc-600 py-8 text-center">
                          {searchQuery ? t("sidebar.noResults") : t("sidebar.noConversations")}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {filteredConversations.map((convo, index) => (
                            <div
                              key={convo.chat_id}
                              onClick={() => handleLoadConversation(convo.chat_id)}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group animate-fade-in"
                              style={{ animationDelay: `${index * 20}ms` }}
                            >
                              {convo.project && (
                                <span className="w-2.5 h-2.5 rounded-full shrink-0 opacity-70" style={{ backgroundColor: convo.project.color }} />
                              )}
                              <span className="truncate flex-1">{convo.title || t("sidebar.untitled")}</span>
                              <ConversationItemMenu
                                conversation={convo}
                                projects={projects}
                                onDelete={handleDeleteConversation}
                                onMove={handleMoveConversation}
                              />
                            </div>
                          ))}

                          {loadingMore && (
                            <div className="flex justify-center py-4">
                              <Loader2 size={16} className="animate-spin text-zinc-500" />
                            </div>
                          )}

                          {hasMore && !loadingMore && (
                            <button
                              onClick={loadMore}
                              className="w-full text-center py-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              Cargar más...
                            </button>
                          )}

                          {!hasMore && conversations.length > 0 && !searchQuery && (
                            <p className="text-xs text-zinc-600 text-center py-3">{t("sidebar.endOfList")}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="mt-0">
                    <AgentActivityTimeline />
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Command Console when chat is active */}
            {isChatActive && (
              <div className="flex-1 flex flex-col min-h-0 animate-fade-in pt-4">
                <CommandConsole
                  onCommand={handleCommand}
                  selectedAgent={selectedAgent}
                  onClearAgent={handleClearAgent}
                  onAuthRequired={handleConsoleFocus}
                  isAuthenticated={!!user}
                  chatId={activeChatId}
                  onChatIdGenerated={(id) => setActiveChatId(id)}
                  fullHeight
                />
              </div>
            )}
          </div>
        </main>

        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

        <CreateProjectDialog
          open={showCreateProject}
          onOpenChange={setShowCreateProject}
          onCreateProject={handleCreateProject}
        />
      </div>
    </div>
  );
};

export default Agents;