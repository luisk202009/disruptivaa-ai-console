import { Bell, Info, AlertTriangle, CheckCircle, XCircle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { es, enUS, pt } from "date-fns/locale";
import i18n from "@/i18n";

const typeConfig = {
  info: { icon: Info, className: "text-blue-400" },
  warning: { icon: AlertTriangle, className: "text-amber-400" },
  success: { icon: CheckCircle, className: "text-green-400" },
  error: { icon: XCircle, className: "text-red-400" },
} as const;

const getLocale = () => {
  const lang = i18n.language;
  if (lang === "es") return es;
  if (lang === "pt") return pt;
  return enUS;
};

interface NotificationCenterProps {
  collapsed?: boolean;
}

const NotificationCenter = ({ collapsed }: NotificationCenterProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
            "hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-200"
          )}
        >
          <span className="relative">
            <Bell size={18} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          {!collapsed && (
            <span className="text-sm tracking-wide">{t("notifications.title")}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-80 p-0 bg-popover backdrop-blur-sm border-border shadow-lg max-h-[420px] overflow-hidden flex flex-col"
      >
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground tracking-wide">
            {t("notifications.title")}
          </h3>
        </div>
        <div className="overflow-y-auto flex-1 scrollbar-minimal">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("notifications.noNotifications")}
            </p>
          ) : (
            notifications.map((notif) => {
              const config = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.info;
              const Icon = config.icon;
              const isRead = notif.read_by?.includes(user?.id ?? "");
              const isInfo = notif.type === "info";

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "px-4 py-3 border-b border-border/40 transition-colors",
                    !isRead && "bg-accent/5"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      className={cn(config.className, isInfo && "text-primary")}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm leading-tight", !isRead ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground/60">
                          {notif.created_at
                            ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: getLocale() })
                            : ""}
                        </span>
                        {!isRead && (
                          <button
                            onClick={() => markAsRead.mutate(notif.id)}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                          >
                            <Check size={10} />
                            {t("notifications.markRead")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
