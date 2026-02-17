import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertCircle, Activity, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, pt } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import type { Tables } from "@/integrations/supabase/types";

type AgentLog = Tables<"ai_agent_logs">;

const dateLocales: Record<string, typeof enUS> = { es, en: enUS, pt };

const statusIcon = (status: string | null) => {
  switch (status) {
    case "completed":
      return CheckCircle2;
    case "error":
      return AlertCircle;
    default:
      return Activity;
  }
};

const AgentActivityTimeline = () => {
  const { t, i18n } = useTranslation("common");
  const { companyColor } = useCompanyBranding();
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("ai_agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const locale = dateLocales[i18n.language] || enUS;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Activity className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${companyColor}20` }}
        >
          <Bot className="w-7 h-7" style={{ color: companyColor }} />
        </div>
        <p className="text-muted-foreground text-sm">
          {t("agents.noActivity")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-sm font-medium text-muted-foreground mb-6">
        {t("agents.activityTitle")}
      </h3>

      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px"
          style={{ backgroundColor: `${companyColor}30` }}
        />

        <div className="space-y-1">
          {logs.map((log) => {
            const Icon = statusIcon(log.result_status);
            const statusKey =
              log.result_status === "completed"
                ? "agents.logStatus.completed"
                : log.result_status === "error"
                  ? "agents.logStatus.error"
                  : "agents.logStatus.working";

            return (
              <div key={log.id} className="flex items-start gap-3 group py-2">
                {/* Node */}
                <div className="relative z-10 mt-0.5 shrink-0">
                  <div
                    className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        log.result_status === "error"
                          ? "#ef444420"
                          : `${companyColor}20`,
                    }}
                  >
                    <Icon
                      className="w-3 h-3"
                      style={{
                        color:
                          log.result_status === "error"
                            ? "#ef4444"
                            : companyColor,
                      }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    {log.action_taken || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {log.created_at
                        ? formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale,
                          })
                        : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      · {t(statusKey)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgentActivityTimeline;
