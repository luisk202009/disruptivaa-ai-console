import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, LogOut } from "lucide-react";
import { DISRUPTIVAA_AGENTS, DisruptivaaAgent } from "@/components/agentDefinitions";
import CommandConsole from "@/components/CommandConsole";
import AuthModal from "@/components/AuthModal";
import Sidebar from "@/components/Sidebar";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/hooks/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
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

  const { clearMessages } = useMessages(activeChatId);

  const generateChatId = useCallback(() => crypto.randomUUID(), []);

  // Check if redirected with agent pre-selected
  useEffect(() => {
    if (location.state?.selectedAgentId) {
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

  // Listen for new conversation event from sidebar
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

  // Listen for load conversation event from sidebar
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

  // Listen for logout event
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
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedAgent(agent);
    const newChatId = generateChatId();
    setActiveChatId(newChatId);
    toast({
      title: t("dashboard.agentSelectedTitle", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
      description: t("dashboard.agentSelectedDesc", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
    });
  };

  const handleConsoleFocus = () => {
    if (!user) {
      setShowAuthModal(true);
      return true;
    }
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

    if (!activeChatId) {
      setActiveChatId(generateChatId());
    }

    // Auto-detect agent if none selected
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

    // Update status in DB
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
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title={t("navigation.signOut")}
                >
                  <LogOut size={18} className="text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
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
            isChatActive ? "max-w-4xl flex-1 flex flex-col min-h-0" : "max-w-4xl"
          )}>
            {/* Welcome section - Hidden when chat is active */}
            {!isChatActive && (
              <div className="animate-fade-in">
                <div className="text-center pt-12 pb-6">
                  <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                    ¿Qué quieres hacer hoy?
                  </h2>
                </div>

                {/* Command Console */}
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

                {/* Agent Cards */}
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {t("agents.selectPrompt")}
                  </p>
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
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-white/[0.06] bg-card"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="text-left">
                          <p className={cn(
                            "font-medium text-sm",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
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

        {/* Auth Modal */}
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    </div>
  );
};

export default Agents;
