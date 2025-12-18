import { Search, FileSearch, Rocket, Calculator, Activity, Loader2 } from "lucide-react";
import CommandConsole from "./CommandConsole";
import AgentCard from "./AgentCard";
import { toast } from "@/hooks/use-toast";
import { useAgents, Agent } from "@/hooks/useAgents";

const agentIcons: Record<string, typeof FileSearch> = {
  "Auditoría": FileSearch,
  "Despliegue": Rocket,
  "Presupuesto": Calculator,
  "Performance Auditor": FileSearch,
  "Creative Deployer": Rocket,
  "Budget Optimizer": Calculator,
};

const agentKeywords: Record<string, string[]> = {
  "Auditoría": ["auditar", "audit", "analizar", "análisis"],
  "Performance Auditor": ["auditar", "audit", "analizar", "análisis", "performance"],
  "Despliegue": ["desplegar", "deploy", "deployment", "publicar"],
  "Creative Deployer": ["desplegar", "deploy", "deployment", "publicar", "creative"],
  "Presupuesto": ["presupuesto", "budget", "costo", "estimación"],
  "Budget Optimizer": ["presupuesto", "budget", "costo", "estimación", "optimizer"],
};

const Dashboard = () => {
  const { agents, loading, updateAgentStatus } = useAgents();

  const handleCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();

    // Find matching agent based on command
    for (const agent of agents) {
      const keywords = agentKeywords[agent.name] || [];
      const matches = keywords.some((kw) => lowerCommand.includes(kw));

      if (matches) {
        // Set to working status
        await updateAgentStatus(agent.id, "working", `Procesando: "${command}"`);
        
        toast({
          title: `Agente ${agent.name} activado`,
          description: "Procesando tu solicitud...",
        });

        // Simulate agent completing after response
        setTimeout(async () => {
          await updateAgentStatus(agent.id, "completed", `Completado: "${command}"`);
        }, 5000);
        
        break;
      }
    }
  };

  const getAgentByName = (name: string): Agent | undefined => {
    return agents.find((a) => a.name === name);
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
            <span>{agents.length} Agentes • {activeAgentsCount} activos</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Search size={20} className="text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
            U
          </div>
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
              Escribe un comando en natural y nuestros agentes AI se encargarán del resto.
            </p>
          </div>

          {/* Command Console */}
          <div className="animate-fade-in stagger-1">
            <CommandConsole onCommand={handleCommand} />
          </div>

          {/* Agent Cards Grid */}
          <div className="grid md:grid-cols-3 gap-4 pt-8">
            {agents.length > 0 ? (
              agents.map((agent, index) => {
                const Icon = agentIcons[agent.name] || FileSearch;
                return (
                  <div key={agent.id} className={`animate-fade-in stagger-${index + 1}`}>
                    <AgentCard
                      title={agent.name}
                      description={agent.role}
                      icon={Icon}
                      status={agent.status}
                      lastAction={agent.last_action || undefined}
                    />
                  </div>
                );
              })
            ) : (
              <>
                <div className="animate-fade-in stagger-1">
                  <AgentCard
                    title="Auditoría"
                    description="Análisis de sitios web"
                    icon={FileSearch}
                    status="idle"
                  />
                </div>
                <div className="animate-fade-in stagger-2">
                  <AgentCard
                    title="Despliegue"
                    description="Gestión de deployments"
                    icon={Rocket}
                    status="idle"
                  />
                </div>
                <div className="animate-fade-in stagger-3">
                  <AgentCard
                    title="Presupuesto"
                    description="Estimaciones de costos"
                    icon={Calculator}
                    status="idle"
                  />
                </div>
              </>
            )}
          </div>

          {/* Recent activity */}
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h3 className="font-semibold text-foreground mb-4">Actividad reciente</h3>
            <div className="space-y-3">
              {agents.filter(a => a.last_action).length > 0 ? (
                agents
                  .filter(a => a.last_action)
                  .map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === "working" ? "bg-primary pulse-status" : 
                          agent.status === "completed" ? "bg-emerald-500" : "bg-muted-foreground"
                        }`} />
                        <div>
                          <p className="text-sm text-foreground">{agent.last_action}</p>
                          <p className="text-xs text-muted-foreground">{agent.name}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad reciente. Envía un comando para comenzar.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
