import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plug, ArrowRight } from "lucide-react";
import { useIntegrations } from "@/hooks/useIntegrations";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { key: "meta_ads", label: "omnichannel.metaAds", color: "#1877F2" },
  { key: "google_ads", label: "omnichannel.googleAds", color: "#4285F4" },
  { key: "tiktok_ads", label: "omnichannel.tiktokAds", color: "#EF7911" },
];

const ConnectivityWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { integrations, loading } = useIntegrations();

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-card p-5 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plug size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">{t("dashboardWidgets.connectivityTitle")}</h3>
        </div>
        <button
          onClick={() => navigate("/connections")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("dashboardWidgets.manageConnections")}
          <ArrowRight size={12} />
        </button>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map(({ key, label, color }) => {
          const isConnected = integrations.some(i => i.platform === key && i.status === "connected");
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-foreground">{t(label)}</span>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                isConnected 
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {isConnected ? t("dashboardWidgets.connected") : t("dashboardWidgets.disconnected")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectivityWidget;
