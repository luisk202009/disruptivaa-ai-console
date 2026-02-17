import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AgentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: "idle" | "working" | "completed" | "error";
  lastAction?: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  className?: string;
}

const useStatusConfig = () => {
  const { t } = useTranslation();
  return {
    idle: {
      label: t("status.idle"),
      color: "bg-muted-foreground",
      pulse: false,
    },
    working: {
      label: t("status.working"),
      color: "bg-primary",
      pulse: true,
    },
    completed: {
      label: t("status.completed"),
      color: "bg-emerald-500",
      pulse: false,
    },
    error: {
      label: t("status.error"),
      color: "bg-destructive",
      pulse: false,
    },
  };
};

const AgentCard = ({
  title,
  description,
  icon: Icon,
  status,
  lastAction,
  stats,
  className,
}: AgentCardProps) => {
  const statusConfig = useStatusConfig();
  const statusInfo = statusConfig[status];

  return (
    <div
      className={cn(
        "glass-strong rounded-xl p-6 transition-all duration-200 hover:border-white/[0.12] group",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'color-mix(in srgb, var(--primary-company, #00A3FF) 15%, transparent)' }}
          >
            <Icon className="w-6 h-6" style={{ color: 'var(--primary-company, #00A3FF)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              statusInfo.color,
              statusInfo.pulse && "pulse-status"
            )}
          />
          <span className="text-xs text-muted-foreground">{statusInfo.label}</span>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-background/50 rounded-lg p-3"
            >
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Last action */}
      {lastAction && (
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-muted-foreground">
            Última acción: <span className="text-foreground/70">{lastAction}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentCard;
