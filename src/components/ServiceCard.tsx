import { motion } from "framer-motion";
import { Globe, Layout, ShoppingBag, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

interface ServiceCardProps {
  url: string;
  siteType: string | null;
  companyColor?: string;
}

const typeConfig: Record<string, { icon: typeof Globe; label: string }> = {
  Ecommerce: { icon: ShoppingBag, label: "Ecommerce" },
  Website: { icon: Globe, label: "Website" },
  Landing: { icon: Layout, label: "Landing" },
};

const ServiceCard = ({ url, siteType, companyColor }: ServiceCardProps) => {
  const { t } = useTranslation();
  const config = typeConfig[siteType || "Website"] || typeConfig.Website;
  const Icon = config.icon;
  const accentColor = companyColor || "var(--primary-company, #00A3FF)";

  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => {
        const normalizedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
        window.open(normalizedUrl, "_blank");
      }}
      className="cursor-pointer rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-primary/30 group"
      style={{ fontFamily: "'Fira Sans', sans-serif" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
          {config.label}
        </Badge>
      </div>

      <p className="text-sm font-medium text-foreground truncate mb-1">{displayUrl}</p>

      <div className="flex items-center gap-1.5 mt-3">
        <span
          className="text-xs font-medium"
          style={{ color: accentColor }}
        >
          {t("dashboard.viewSite")}
        </span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accentColor }} />
      </div>
    </motion.div>
  );
};

export default ServiceCard;
