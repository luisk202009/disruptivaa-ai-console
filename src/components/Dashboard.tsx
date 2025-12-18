import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Palette, PenTool, BarChart3, Users, ImageIcon, Loader2, LogOut } from "lucide-react";
import CommandConsole from "./CommandConsole";
import AuthModal from "./AuthModal";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/hooks/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

// Definición de los 5 agentes AI-First de Disruptivaa (IDs coinciden con tabla ai_agents)
export const DISRUPTIVAA_AGENTS = [
  {
    id: "smart-brand-architect",
    dbName: "Smart Brand Architect",
    name: "Smart Brand Architect",
    description: "Generador de identidades visuales",
    icon: Palette,
    keywords: ["marca", "brand", "identidad", "logo", "visual", "branding", "colores", "tipografía"],
    systemInstruction: "Eres Smart Brand Architect, experto en identidad visual y branding. Usa el Manual de Marca de Disruptivaa del bucket knowledge-base como referencia para mantener coherencia en tus respuestas.",
  },
  {
    id: "ghostwriter-pro",
    dbName: "GhostWriter Pro",
    name: "GhostWriter Pro",
    description: "Plataforma de contenidos y blogs",
    icon: PenTool,
    keywords: ["contenido", "blog", "artículo", "escribir", "copy", "texto", "redacción", "post"],
    systemInstruction: "Eres GhostWriter Pro, especialista en creación de contenido y copywriting. Consulta el Portafolio y Manual de Marca de Disruptivaa en el bucket knowledge-base para mantener el tono de voz de la marca.",
  },
  {
    id: "ads-optimizer",
    dbName: "Ads Optimizer Agent",
    name: "Ads Optimizer Agent",
    description: "Optimizador de presupuestos Meta/Google",
    icon: BarChart3,
    keywords: ["ads", "publicidad", "meta", "google", "facebook", "instagram", "presupuesto", "campaña", "anuncios"],
    systemInstruction: "Eres Ads Optimizer Agent, experto en optimización de campañas publicitarias en Meta y Google. Usa los documentos del bucket knowledge-base para alinear estrategias con la marca Disruptivaa.",
    requiresConnection: true,
  },
  {
    id: "ai-crm-sales",
    dbName: "AI-CRM Sales Bot",
    name: "AI-CRM Sales Bot",
    description: "Calificador de leads automatizado",
    icon: Users,
    keywords: ["lead", "leads", "crm", "ventas", "sales", "cliente", "prospecto", "calificar", "seguimiento"],
    systemInstruction: "Eres AI-CRM Sales Bot, especialista en calificación de leads y automatización de ventas. Referencia el Manual de Marca de Disruptivaa del bucket knowledge-base para comunicaciones coherentes.",
  },
  {
    id: "visual-content-bot",
    dbName: "Visual Content Bot",
    name: "Visual Content Bot",
    description: "Diseño de piezas bajo demanda",
    icon: ImageIcon,
    keywords: ["diseño", "imagen", "gráfico", "pieza", "visual", "banner", "post", "creative", "arte"],
    systemInstruction: "Eres Visual Content Bot, diseñador de contenido visual bajo demanda. Consulta el Manual de Marca y Portafolio de Disruptivaa en el bucket knowledge-base para mantener coherencia visual.",
  },
];

export type DisruptivaaAgent = typeof DISRUPTIVAA_AGENTS[number];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { agents, loading, updateAgentStatus } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DisruptivaaAgent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const { clearMessages } = useMessages();

  // Check if redirected from protected route or from Agents page with agent pre-selected
  useEffect(() => {
    if (location.state?.showAuthModal) {
      setShowAuthModal(true);
      window.history.replaceState({}, document.title);
    }
    if (location.state?.selectedAgentId) {
      const agent = DISRUPTIVAA_AGENTS.find(a => a.id === location.state.selectedAgentId);
      if (agent) {
        setSelectedAgent(agent);
        toast({
          title: `${agent.name} seleccionado`,
          description: `Ahora estás hablando con ${agent.name}`,
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
      clearMessages();
    };
    window.addEventListener("newConversation", handleNewConversation);
    return () => window.removeEventListener("newConversation", handleNewConversation);
  }, [clearMessages]);

  const handleSelectAgent = (agent: DisruptivaaAgent) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedAgent(agent);
    toast({
      title: `${agent.name} seleccionado`,
      description: `Ahora estás hablando con ${agent.name}`,
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
  };

  const handleCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    setIsChatActive(true);

    // Si no hay agente seleccionado, detectar automáticamente
    if (!selectedAgent) {
      for (const agent of DISRUPTIVAA_AGENTS) {
        const matches = agent.keywords.some((kw) => lowerCommand.includes(kw));
        if (matches) {
          setSelectedAgent(agent);
          toast({
            title: `${agent.name} detectado`,
            description: "Procesando tu solicitud...",
          });
          break;
        }
      }
    }

    // Update status in DB if matching agent exists
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
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-end px-6 shrink-0">
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={18} className="text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Iniciar sesión
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
              {/* Title - No logo */}
              <div className="text-center pt-12 pb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  ¿Qué quieres hacer hoy?
                </h2>
              </div>

              {/* Command Console - Right after title */}
              <div className="mb-8">
                <CommandConsole 
                  onCommand={handleCommand} 
                  selectedAgent={selectedAgent}
                  onClearAgent={handleClearAgent}
                  onAuthRequired={handleConsoleFocus}
                  isAuthenticated={!!user}
                  autoFocus
                  showMessages={false}
                />
              </div>

              {/* Agent Cards - Below input */}
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Selecciona un agente para comenzar
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
                        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300",
                        "hover:border-primary/50 hover:bg-primary/5",
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card"
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
                          {agent.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agent.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Command Console when chat is active - Full height */}
          {isChatActive && (
            <div className="flex-1 flex flex-col min-h-0 animate-fade-in pt-4">
              <CommandConsole 
                onCommand={handleCommand} 
                selectedAgent={selectedAgent}
                onClearAgent={handleClearAgent}
                onAuthRequired={handleConsoleFocus}
                isAuthenticated={!!user}
                fullHeight
              />
            </div>
          )}
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Dashboard;
