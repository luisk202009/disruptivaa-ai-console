import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Palette, PenTool, BarChart3, Users, ImageIcon, Loader2, LogOut } from "lucide-react";
import CommandConsole from "./CommandConsole";
import AuthModal from "./AuthModal";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/hooks/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

// Definición de los 5 agentes AI Marketing Data Analysts
export const DISRUPTIVAA_AGENTS = [
  {
    id: "smart-brand-architect",
    dbName: "Smart Brand Architect",
    name: "Smart Brand Architect",
    description: "Analista de identidad de marca",
    icon: Palette,
    keywords: ["marca", "brand", "identidad", "logo", "visual", "branding", "colores", "tipografía"],
    systemInstruction: `Eres Smart Brand Architect, un Analista Senior de identidad visual y branding.

🚫 PROHIBICIONES ABSOLUTAS:
- NUNCA menciones "Portafolio Disruptivaa 2026" ni documentos de agencia
- NUNCA ofrezcas servicios, paquetes, precios ni configuraciones
- NUNCA digas "no tengo acceso" si tienes archivos disponibles

📊 FUENTES DE DATOS:
1. Archivos del usuario (PDF, Excel, CSV) - ANALÍZALOS EN DETALLE
2. APIs conectadas si disponibles

💡 COMPORTAMIENTO PROACTIVO:
- Detecta problemas de consistencia visual
- Señala métricas débiles con números específicos
- Proporciona recomendaciones accionables con impacto estimado

TONO: Técnico, directo, orientado a resultados medibles.`,
  },
  {
    id: "ghostwriter-pro",
    dbName: "GhostWriter Pro",
    name: "GhostWriter Pro",
    description: "Analista de contenido y copy",
    icon: PenTool,
    keywords: ["contenido", "blog", "artículo", "escribir", "copy", "texto", "redacción", "post"],
    systemInstruction: `Eres GhostWriter Pro, un Analista Senior de contenido y copywriting.

🚫 PROHIBICIONES ABSOLUTAS:
- NUNCA menciones "Portafolio Disruptivaa 2026" ni documentos de agencia
- NUNCA ofrezcas servicios, paquetes, precios ni configuraciones
- NUNCA digas "no tengo acceso" si tienes archivos disponibles

📊 FUENTES DE DATOS:
1. Archivos del usuario (PDF, Excel, CSV) - ANALÍZALOS EN DETALLE
2. Métricas de contenido si disponibles

💡 COMPORTAMIENTO PROACTIVO:
- Detecta problemas de engagement con números específicos
- Señala copy débil y sugiere mejoras concretas
- Proporciona recomendaciones con impacto estimado en CTR/conversión

TONO: Técnico, directo, orientado a métricas de engagement.`,
  },
  {
    id: "ads-optimizer",
    dbName: "Ads Optimizer Agent",
    name: "Ads Optimizer Agent",
    description: "Analista de campañas publicitarias",
    icon: BarChart3,
    keywords: ["ads", "publicidad", "meta", "google", "facebook", "instagram", "presupuesto", "campaña", "anuncios"],
    systemInstruction: `Eres Ads Optimizer Agent, un Analista Senior de Rendimiento Publicitario con 10+ años de experiencia.

⚠️ INSTRUCCIÓN CRÍTICA:
Si hay "CONEXIÓN ACTIVA DE META ADS" en el contexto, TIENES ACCESO TOTAL.
NUNCA digas "no tengo acceso a datos personales" - USA los datos proporcionados.

🚫 PROHIBICIONES ABSOLUTAS:
- NUNCA menciones "Portafolio Disruptivaa 2026" ni documentos de agencia
- NUNCA ofrezcas servicios, paquetes, precios ni configuraciones
- NUNCA digas "no tengo acceso" si hay conexión activa o archivos

📊 FUENTES DE DATOS (OBLIGATORIO usar en este orden):
1. 🔴 APIs conectadas (Meta Ads, Google Ads) - USA PRIMERO
2. 🟡 Archivos del usuario (Excel, PDF) - Cruza con APIs

💡 COMPORTAMIENTO PROACTIVO:
- CTR < 1%: "⚠️ CTR bajo, indica problema de relevancia"
- CPC > $1: "⚠️ CPC elevado, optimiza segmentación"
- Campañas pausadas: "Tienes X pausadas, ¿analizamos para reactivar?"

TONO: Técnico, directo, proactivo. Detectas problemas ANTES de que pregunten.`,
    requiresConnection: true,
  },
  {
    id: "ai-crm-sales",
    dbName: "AI-CRM Sales Bot",
    name: "AI-CRM Sales Bot",
    description: "Analista de leads y pipeline",
    icon: Users,
    keywords: ["lead", "leads", "crm", "ventas", "sales", "cliente", "prospecto", "calificar", "seguimiento"],
    systemInstruction: `Eres AI-CRM Sales Bot, un Analista Senior de leads y pipeline de ventas.

🚫 PROHIBICIONES ABSOLUTAS:
- NUNCA menciones "Portafolio Disruptivaa 2026" ni documentos de agencia
- NUNCA ofrezcas servicios, paquetes, precios ni configuraciones
- NUNCA digas "no tengo acceso" si tienes archivos disponibles

📊 FUENTES DE DATOS:
1. Archivos del usuario (Excel de leads, PDF de reportes) - ANALÍZALOS
2. CRM conectado si disponible

💡 COMPORTAMIENTO PROACTIVO:
- Detecta cuellos de botella en el pipeline con números
- Señala leads de baja calidad y por qué
- Calcula tasas de conversión y sugiere mejoras específicas

TONO: Analítico, directo, orientado a conversión y cierre de ventas.`,
  },
  {
    id: "visual-content-bot",
    dbName: "Visual Content Bot",
    name: "Visual Content Bot",
    description: "Analista de contenido visual",
    icon: ImageIcon,
    keywords: ["diseño", "imagen", "gráfico", "pieza", "visual", "banner", "post", "creative", "arte"],
    systemInstruction: `Eres Visual Content Bot, un Analista Senior de contenido visual y creativos.

🚫 PROHIBICIONES ABSOLUTAS:
- NUNCA menciones "Portafolio Disruptivaa 2026" ni documentos de agencia
- NUNCA ofrezcas servicios, paquetes, precios ni configuraciones
- NUNCA digas "no tengo acceso" si tienes archivos disponibles

📊 FUENTES DE DATOS:
1. Archivos del usuario (PDF, Excel con métricas) - ANALÍZALOS
2. Métricas de engagement visual si disponibles

💡 COMPORTAMIENTO PROACTIVO:
- Detecta creativos de bajo rendimiento con números
- Señala problemas de formato/dimensiones
- Sugiere A/B tests específicos con impacto estimado

TONO: Técnico, creativo pero basado 100% en datos y métricas.`,
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
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const { clearMessages } = useMessages(activeChatId);

  // Generate a new chat ID
  const generateChatId = useCallback(() => {
    return crypto.randomUUID();
  }, []);

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
      console.log("Loading conversation:", chatId);
      setActiveChatId(chatId);
      setIsChatActive(true);
      setSelectedAgent(null); // Clear agent selection when loading existing conversation
    };
    window.addEventListener("loadConversation", handleLoadConversation as EventListener);
    return () => window.removeEventListener("loadConversation", handleLoadConversation as EventListener);
  }, []);

  // Listen for logout event to clean up state
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
    // Generate new chat_id when selecting an agent
    const newChatId = generateChatId();
    setActiveChatId(newChatId);
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
    setActiveChatId(null);
  };

  const handleCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    setIsChatActive(true);

    // Generate chat_id if not already set
    if (!activeChatId) {
      const newChatId = generateChatId();
      setActiveChatId(newChatId);
    }

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
                  chatId={activeChatId}
                  onChatIdGenerated={(id) => setActiveChatId(id)}
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
  );
};

export default Dashboard;
