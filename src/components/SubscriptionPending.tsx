import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import PricingPlans from "@/components/PricingPlans";

const SubscriptionPending = () => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { companyName } = useCompanyBranding();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
      <div className="w-full max-w-4xl text-center space-y-8">
        {companyName && (
          <p className="text-sm font-medium tracking-widest uppercase text-zinc-500">
            {companyName}
          </p>
        )}

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-white font-['Fira_Sans',sans-serif]">
            {t("subscription.title")}
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
            Selecciona un plan para activar tu cuenta y acceder a todas las funcionalidades.
          </p>
        </div>

        <PricingPlans />

        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="text-sm text-zinc-500 hover:text-white"
        >
          <LogOut size={14} className="mr-2" />
          {t("navigation.signOut")}
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionPending;
