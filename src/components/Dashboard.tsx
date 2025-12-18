import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Palette, PenTool, BarChart3, Users, ImageIcon, Activity, Loader2, LogOut } from "lucide-react";
import CommandConsole from "./CommandConsole";
import AgentCard from "./AgentCard";
import AuthGateModal from "./AuthGateModal";
import { toast } from "@/hooks/use-toast";
import { useAgents, Agent } from "@/hooks/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface RecentMessage {
  id: string;
  content: string;
  created_at: string;
  role: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { agents, loading, updateAgentStatus } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<DisruptivaaAgent | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch recent messages from agent_messages
  useEffect(() => {
    const fetchRecentMessages = async () => {
      const { data, error } = await supabase
        .from("agent_messages")
        .select("id, content, created_at, role")
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentMessages(data);
      }
    };

    fetchRecentMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("recent_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_messages" },
        () => fetchRecentMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Detect agent from message content
  const detectAgentFromMessage = (content: string): DisruptivaaAgent => {
    const lowerContent = content.toLowerCase();
    for (const agent of DISRUPTIVAA_AGENTS) {
      if (agent.keywords.some(kw => lowerContent.includes(kw))) {
        return agent;
      }
    }
    // Default to first agent if no match
    return DISRUPTIVAA_AGENTS[0];
  };

  const handleActivityClick = (message: RecentMessage) => {
    const agent = detectAgentFromMessage(message.content);
    setSelectedAgent(agent);
    toast({
      title: `${agent.name} seleccionado`,
      description: "Continuando conversación...",
    });
  };

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
      return true; // Return true to indicate focus was blocked
    }
    return false;
  };

  const handleClearAgent = () => {
    setSelectedAgent(null);
  };

  const handleCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();

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

  const activeAgentsCount = agents.filter((a) => a.status === "working").length;

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
      <header className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">AI-Agent Console</h1>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Activity size={12} />
            <span>{DISRUPTIVAA_AGENTS.length} Agentes • {activeAgentsCount} activos</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Search size={20} className="text-muted-foreground" />
          </button>
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
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome section */}
          <div className="text-center py-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              ¿Qué quieres hacer hoy?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Selecciona un agente o escribe directamente y nuestros AI se encargarán del resto.
            </p>
          </div>

          {/* Command Console */}
          <div className="animate-fade-in stagger-1">
            <CommandConsole 
              onCommand={handleCommand} 
              selectedAgent={selectedAgent}
              onClearAgent={handleClearAgent}
              onAuthRequired={handleConsoleFocus}
            />
          </div>

          {/* Agent Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
            {DISRUPTIVAA_AGENTS.map((agent, index) => {
              const Icon = agent.icon;
              const isSelected = selectedAgent?.id === agent.id;
              // Find matching DB agent for status
              const dbAgent = agents.find(a => 
                a.name.toLowerCase().includes(agent.name.toLowerCase().split(' ')[0])
              );
              const status = dbAgent?.status || "idle";
              const lastAction = dbAgent?.last_action;

              return (
                <div 
                  key={agent.id} 
                  className={`animate-fade-in stagger-${index + 1} cursor-pointer`}
                  onClick={() => handleSelectAgent(agent)}
                >
                  <AgentCard
                    title={agent.name}
                    description={agent.description}
                    icon={Icon}
                    status={status as "idle" | "working" | "completed" | "error"}
                    lastAction={lastAction || undefined}
                    className={cn(
                      "transition-all duration-300",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* Recent activity - Now using agent_messages */}
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Actividad reciente</h3>
              <button 
                onClick={() => navigate("/history")}
                className="text-xs text-primary hover:underline"
              >
                Ver todo
              </button>
            </div>
            <div className="space-y-3">
              {recentMessages.length > 0 ? (
                recentMessages.map((msg) => {
                  const agent = detectAgentFromMessage(msg.content);
                  const Icon = agent.icon;
                  const snippet = msg.content.length > 80 
                    ? msg.content.substring(0, 80) + "..." 
                    : msg.content;
                  
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleActivityClick(msg)}
                      className="flex items-center justify-between py-3 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#EF7911] flex items-center justify-center">
                          <Icon size={14} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate max-w-[300px]">{snippet}</p>
                          <p className="text-xs text-muted-foreground">{agent.name}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {format(new Date(msg.created_at), "d MMM, HH:mm", { locale: es })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad reciente. Selecciona un agente para comenzar.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Auth Gate Modal */}
      <AuthGateModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Dashboard;
