import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Button } from "@/components/ui/button";
import { LogOut, Mail } from "lucide-react";

const SubscriptionPending = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { companyName, companyColor } = useCompanyBranding();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {companyName && (
          <p className="text-sm font-medium tracking-widest uppercase text-zinc-500">
            {companyName}
          </p>
        )}

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-white font-['Fira_Sans',sans-serif]">
            {t("subscription.title")}
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {t("subscription.subtitle")}
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => window.location.href = "mailto:soporte@disruptivaa.com"}
            className="w-full h-11 text-sm font-medium text-white"
            style={{ backgroundColor: companyColor }}
          >
            <Mail size={16} className="mr-2" />
            {t("subscription.contactSupport")}
          </Button>

          <Button
            variant="outline"
            onClick={() => signOut()}
            className="w-full h-11 text-sm border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <LogOut size={16} className="mr-2" />
            {t("navigation.signOut")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPending;
