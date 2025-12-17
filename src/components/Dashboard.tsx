import { useState } from "react";
import { Search, FileSearch, Rocket, Calculator, Activity } from "lucide-react";
import CommandConsole from "./CommandConsole";
import AgentCard from "./AgentCard";
import { toast } from "@/hooks/use-toast";

interface AgentStatus {
  id: string;
  status: "idle" | "working" | "completed" | "error";
  lastAction?: string;
}

const Dashboard = () => {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([
    { id: "audit", status: "idle" },
    { id: "deploy", status: "working", lastAction: "Analizando dependencias..." },
    { id: "budget", status: "completed", lastAction: "Presupuesto Q4 generado" },
  ]);

  const handleCommand = (command: string) => {
    // Simulate agent activation
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes("auditar") || lowerCommand.includes("audit")) {
      setAgentStatuses(prev => 
        prev.map(a => a.id === "audit" ? { ...a, status: "working", lastAction: "Iniciando auditoría..." } : a)
      );
      toast({
        title: "Agente de Auditoría activado",
        description: "Analizando el sitio web...",
      });
    } else if (lowerCommand.includes("desplegar") || lowerCommand.includes("deploy")) {
      setAgentStatuses(prev => 
        prev.map(a => a.id === "deploy" ? { ...a, status: "working", lastAction: "Preparando despliegue..." } : a)
      );
      toast({
        title: "Agente de Despliegue activado",
        description: "Verificando cambios...",
      });
    } else if (lowerCommand.includes("presupuesto") || lowerCommand.includes("budget")) {
      setAgentStatuses(prev => 
        prev.map(a => a.id === "budget" ? { ...a, status: "working", lastAction: "Calculando costos..." } : a)
      );
      toast({
        title: "Agente de Presupuesto activado",
        description: "Generando estimaciones...",
      });
    } else {
      toast({
        title: "Comando recibido",
        description: `Procesando: "${command}"`,
      });
    }
  };

  const getStatus = (id: string) => agentStatuses.find(a => a.id === id);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">AI-Agent Console</h1>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Activity size={12} />
            <span>3 Agentes activos</span>
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
            <div className="animate-fade-in stagger-1">
              <AgentCard
                title="Auditoría"
                description="Análisis de sitios web"
                icon={FileSearch}
                status={getStatus("audit")?.status || "idle"}
                lastAction={getStatus("audit")?.lastAction}
                stats={[
                  { label: "Sitios analizados", value: 24 },
                  { label: "Issues detectados", value: 156 },
                ]}
              />
            </div>

            <div className="animate-fade-in stagger-2">
              <AgentCard
                title="Despliegue"
                description="Gestión de deployments"
                icon={Rocket}
                status={getStatus("deploy")?.status || "idle"}
                lastAction={getStatus("deploy")?.lastAction}
                stats={[
                  { label: "Despliegues", value: 89 },
                  { label: "Uptime", value: "99.9%" },
                ]}
              />
            </div>

            <div className="animate-fade-in stagger-3">
              <AgentCard
                title="Presupuesto"
                description="Estimaciones de costos"
                icon={Calculator}
                status={getStatus("budget")?.status || "idle"}
                lastAction={getStatus("budget")?.lastAction}
                stats={[
                  { label: "Presupuestos", value: 12 },
                  { label: "Precisión", value: "94%" },
                ]}
              />
            </div>
          </div>

          {/* Recent activity */}
          <div className="glass rounded-2xl p-6 animate-fade-in">
            <h3 className="font-semibold text-foreground mb-4">Actividad reciente</h3>
            <div className="space-y-3">
              {[
                { time: "Hace 2 min", action: "Auditoría completada para cliente-xyz.com", agent: "Auditoría" },
                { time: "Hace 15 min", action: "Despliegue exitoso en producción", agent: "Despliegue" },
                { time: "Hace 1 hora", action: "Presupuesto Q4 generado y enviado", agent: "Presupuesto" },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.agent}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
