import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Globe2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import OmnichannelPerformance from "./OmnichannelPerformance";
import { useAuth } from "@/contexts/AuthContext";
import GoalsSummaryWidget from "./dashboard/GoalsSummaryWidget";
import RecentActivityWidget from "./dashboard/RecentActivityWidget";
import ConnectivityWidget from "./dashboard/ConnectivityWidget";
import SmartAlerts from "./dashboard/SmartAlerts";
import AgentCard from "./AgentCard";
import ServiceCard from "./ServiceCard";
import { DISRUPTIVAA_AGENTS } from "./agentDefinitions";
import { useAgents } from "@/hooks/useAgents";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";

// Keep exports for other consumers
export { DISRUPTIVAA_AGENTS } from "./agentDefinitions";
export type { DisruptivaaAgent } from "./agentDefinitions";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { agents } = useAgents();
  const { profile } = useUserProfile();
  const { companyColor } = useCompanyBranding();

  const { data: websites = [] } = useQuery({
    queryKey: ["company_websites", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("company_websites")
        .select("*")
        .eq("company_id", profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Merge static agent definitions with live DB status
  const mergedAgents = DISRUPTIVAA_AGENTS.map((def) => {
    const live = agents.find((a) => a.name === def.dbName);
    return {
      ...def,
      status: (live?.status || "idle") as "idle" | "working" | "completed" | "error",
      lastAction: live?.last_action || null,
    };
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
        <h1 className="text-lg font-semibold text-foreground">{t("dashboardWidgets.welcomeTitle")}</h1>
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
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground">{t("dashboardWidgets.welcomeSubtitle")}</p>

          {/* Omnichannel Performance */}
          {user && <OmnichannelPerformance />}

          {/* AI Agents Section */}
          {user && (
            <section>
              <h2 className="text-base font-semibold text-foreground mb-4">{t("dashboard.myAgents")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mergedAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    title={agent.name}
                    description={agent.description}
                    icon={agent.icon}
                    status={agent.status}
                    lastAction={agent.lastAction ?? undefined}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Digital Ecosystem Section */}
          {user && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe2 size={18} style={{ color: 'var(--primary-company, #00A3FF)' }} />
                <h2 className="text-base font-semibold text-foreground">{t("dashboard.digitalEcosystem")}</h2>
              </div>
              {websites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {websites.map((site) => (
                    <ServiceCard
                      key={site.id}
                      url={site.url}
                      siteType={site.site_type}
                      companyColor={companyColor}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
                  <Globe2 size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{t("dashboard.noWebsites")}</p>
                </div>
              )}
            </section>
          )}

          {/* Smart Alerts */}

          {/* Smart Alerts */}
          {user && <SmartAlerts />}

          {/* Widget Grid */}
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GoalsSummaryWidget />
              <RecentActivityWidget />
              <ConnectivityWidget />
            </div>
          )}

          {/* Unauthenticated state */}
          {!user && (
            <div className="text-center py-20 space-y-6">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {t("auth.welcomeTitle")}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("auth.welcomeDescription")}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/auth")}
                  className="px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t("auth.signIn")}
                </button>
                <button
                  onClick={() => navigate("/auth?tab=register")}
                  className="px-6 py-2.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                >
                  {t("auth.createAccount")}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
