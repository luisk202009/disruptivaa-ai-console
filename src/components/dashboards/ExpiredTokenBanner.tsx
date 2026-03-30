import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Integration } from "@/hooks/useIntegrations";

const PLATFORM_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
};

interface ExpiredTokenBannerProps {
  expiredPlatforms: Integration[];
}

export const ExpiredTokenBanner = ({ expiredPlatforms }: ExpiredTokenBannerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || expiredPlatforms.length === 0) return null;

  return (
    <div className="mx-6 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle size={18} className="text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-destructive">
          {t("widget.expiredBannerTitle")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("widget.expiredBannerDesc")}{" "}
          <span className="font-medium text-foreground">
            {expiredPlatforms.map(p => PLATFORM_LABELS[p.platform] || p.platform).join(", ")}
          </span>
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={() => navigate("/connections")}
        >
          {t("widget.expiredBannerAction")}
          <ArrowRight size={14} />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setDismissed(true)}
      >
        <X size={14} />
      </Button>
    </div>
  );
};
