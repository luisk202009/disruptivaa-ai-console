import { useNavigate } from "react-router-dom";
import { DISRUPTIVAA_AGENTS, DisruptivaaAgent } from "@/components/Dashboard";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";

const Agents = () => {
  const navigate = useNavigate();

  const handleSelectAgent = (agent: DisruptivaaAgent) => {
    navigate("/", { state: { selectedAgentId: agent.id } });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center px-6">
          <h1 className="text-xl font-semibold text-foreground">Agentes AI</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Nuestros Agentes Especializados
              </h2>
              <p className="text-muted-foreground">
                Selecciona un agente para comenzar una conversación
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DISRUPTIVAA_AGENTS.map((agent) => {
                const Icon = agent.icon;

                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className={cn(
                      "flex flex-col items-start gap-4 p-6 rounded-2xl border-2 transition-all duration-300",
                      "hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10",
                      "border-border bg-card text-left group"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                      "bg-muted group-hover:bg-primary/20"
                    )}>
                      <Icon className={cn(
                        "w-7 h-7 transition-colors",
                        "text-muted-foreground group-hover:text-primary"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agent.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {agent.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Agents;
