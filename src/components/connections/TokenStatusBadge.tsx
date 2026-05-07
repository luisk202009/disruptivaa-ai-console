import { CheckCircle2, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow, format } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Integration } from "@/hooks/useIntegrations";
import { cn } from "@/lib/utils";

const DATE_LOCALES: Record<string, typeof es> = { es, en: enUS, pt: ptBR };

export type TokenStatusKind = "active" | "expiring" | "refreshable" | "expired" | "none";

export const getTokenStatus = (
  integration: Integration | undefined
): { kind: TokenStatusKind; expiresAt: Date | null } => {
  if (!integration || integration.status !== "connected") {
    return { kind: "none", expiresAt: null };
  }
  if (!integration.token_expires_at) {
    return { kind: "active", expiresAt: null };
  }
  const expiresAt = new Date(integration.token_expires_at);
  const diffMs = expiresAt.getTime() - Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (diffMs <= 0) {
    return { kind: integration.has_refresh_token ? "refreshable" : "expired", expiresAt };
  }
  if (diffMs < sevenDays) {
    return { kind: integration.has_refresh_token ? "refreshable" : "expiring", expiresAt };
  }
  return { kind: "active", expiresAt };
};

interface Props {
  integration: Integration;
}

const STYLES: Record<Exclude<TokenStatusKind, "none">, { cls: string; Icon: typeof CheckCircle2 }> = {
  active: { cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", Icon: CheckCircle2 },
  expiring: { cls: "text-amber-400 bg-amber-500/10 border-amber-500/20", Icon: Clock },
  refreshable: { cls: "text-sky-400 bg-sky-500/10 border-sky-500/20", Icon: RefreshCw },
  expired: { cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
};

const TokenStatusBadge = ({ integration }: Props) => {
  const { t, i18n } = useTranslation();
  const { kind, expiresAt } = getTokenStatus(integration);

  if (kind === "none") return null;

  const dateLocale = DATE_LOCALES[i18n.language] || es;
  const { cls, Icon } = STYLES[kind];

  const relative = expiresAt
    ? formatDistanceToNow(expiresAt, { locale: dateLocale, addSuffix: true })
    : null;

  const label =
    kind === "active"
      ? relative
        ? t("connections.tokenStatus.activeWithDate", { time: relative })
        : t("connections.tokenStatus.active")
      : kind === "expiring"
      ? t("connections.tokenStatus.expiring", { time: relative })
      : kind === "refreshable"
      ? t("connections.tokenStatus.refreshable")
      : t("connections.tokenStatus.expired", { time: relative });

  const tooltip =
    kind === "active"
      ? t("connections.tokenStatus.activeTooltip", {
          date: expiresAt ? format(expiresAt, "PPP", { locale: dateLocale }) : "—",
        })
      : kind === "expiring"
      ? t("connections.tokenStatus.expiringTooltip")
      : kind === "refreshable"
      ? t("connections.tokenStatus.refreshableTooltip")
      : t("connections.tokenStatus.expiredTooltip");

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border cursor-help",
              cls
            )}
          >
            <Icon size={12} />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TokenStatusBadge;
