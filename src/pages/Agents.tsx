import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DISRUPTIVAA_AGENTS, DisruptivaaAgent } from "@/components/Dashboard";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

const Agents = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "agents"]);
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAgent, setPendingAgent] = useState<DisruptivaaAgent | null>(null);

  const handleSelectAgent = (agent: DisruptivaaAgent) => {
    if (!user) {
      setPendingAgent(agent);
      setShowAuthModal(true);
      return;
    }
    navigate("/", { state: { selectedAgentId: agent.id } });
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingAgent) {
      navigate("/", { state: { selectedAgentId: pendingAgent.id } });
      setPendingAgent(null);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center px-6">
          <h1 className="text-xl font-semibold text-foreground">{t("agents.title")}</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {t("agents.subtitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("agents.selectPrompt")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DISRUPTIVAA_AGENTS.map((agent) => {
                const Icon = agent.icon;
                const translatedKeywords = t(`${agent.id}.keywords`, { 
                  ns: "agents", 
                  returnObjects: true 
                }) as string[];
                const keywords = Array.isArray(translatedKeywords) 
                  ? translatedKeywords 
                  : agent.keywords;

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
                        {t(`${agent.id}.name`, { ns: "agents" })}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(`${agent.id}.description`, { ns: "agents" })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {keywords.slice(0, 3).map((keyword) => (
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

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Agents;
