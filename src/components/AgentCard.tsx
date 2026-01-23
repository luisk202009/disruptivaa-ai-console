import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

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

const statusConfig = {
  idle: {
    label: "Inactivo",
    color: "bg-muted-foreground",
    pulse: false,
  },
  working: {
    label: "Trabajando",
    color: "bg-primary",
    pulse: true,
  },
  completed: {
    label: "Completado",
    color: "bg-emerald-500",
    pulse: false,
  },
  error: {
    label: "Error",
    color: "bg-destructive",
    pulse: false,
  },
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
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            <Icon className="w-6 h-6 text-foreground" />
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
