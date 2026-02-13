import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import OmnichannelPerformance from "./OmnichannelPerformance";
import { useAuth } from "@/contexts/AuthContext";
import GoalsSummaryWidget from "./dashboard/GoalsSummaryWidget";
import RecentActivityWidget from "./dashboard/RecentActivityWidget";
import ConnectivityWidget from "./dashboard/ConnectivityWidget";
import SmartAlerts from "./dashboard/SmartAlerts";

// Keep DISRUPTIVAA_AGENTS export for Agents page and other consumers
export { DISRUPTIVAA_AGENTS } from "./agentDefinitions";
export type { DisruptivaaAgent } from "./agentDefinitions";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

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

      {/* Main content - Analytics widgets */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <p className="text-sm text-muted-foreground">{t("dashboardWidgets.welcomeSubtitle")}</p>

          {/* Omnichannel Performance */}
          {user && <OmnichannelPerformance />}

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
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">{t("connections.loginRequired")}</p>
              <button
                onClick={() => navigate("/auth")}
                className="px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t("auth.signIn")}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
