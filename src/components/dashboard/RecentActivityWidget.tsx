import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, pt } from "date-fns/locale";
import i18next from "i18next";

interface RecentMessage {
  id: string;
  content: string;
  created_at: string;
  chat_id: string;
}

const getLocale = () => {
  const lang = i18next.language;
  if (lang === "es") return es;
  if (lang === "pt") return pt;
  return enUS;
};

const RecentActivityWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setMessages([]); setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("agent_messages")
        .select("id, content, created_at, chat_id")
        .eq("user_id", user.id)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(5);
      setMessages(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleClick = (chatId: string) => {
    navigate("/agents");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("loadConversation", { detail: { chatId } }));
    }, 100);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-card p-5 animate-pulse">
        <div className="h-5 w-36 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">{t("dashboardWidgets.activityTitle")}</h3>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("dashboardWidgets.activityEmpty")}</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => handleClick(msg.chat_id)}
              className="w-full flex items-start gap-2.5 text-left hover:bg-white/[0.03] rounded-lg p-2 -mx-2 transition-colors"
            >
              <Bot size={14} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">
                  {msg.content.slice(0, 80)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(msg.created_at!), { addSuffix: true, locale: getLocale() })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivityWidget;
