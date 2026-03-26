import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ColorPicker } from "@/components/ColorPicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo-disruptivaa.png";

const CompanyOnboarding = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brandColor, setBrandColor] = useState("#00A3FF");

  const createCompany = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Save full_name to profile first
      if (fullName.trim()) {
        await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', user.id);
        if (profileError) throw profileError;
      }

      const { error } = await supabase.rpc('create_company_for_user', {
        _company_name: companyName,
        _branding_color: brandColor,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("onboarding.success"));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["company_branding"] });
    },
    onError: () => {
      toast.error(t("onboarding.error"));
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <div className="w-full max-w-md px-8 space-y-8">
        <div className="flex justify-center">
          <img src={logo} alt="Disruptivaa" className="h-10" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-zinc-100 tracking-wide">
            {t("onboarding.title")}
          </h1>
          <p className="text-sm text-zinc-500">
            {t("onboarding.subtitle")}
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              {t("onboarding.fullName", "Nombre completo")}
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre completo"
              className="bg-white/[0.03] border-white/[0.08] text-zinc-200 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              {t("onboarding.companyName")}
            </Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t("onboarding.companyPlaceholder")}
              className="bg-white/[0.03] border-white/[0.08] text-zinc-200 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">
              {t("onboarding.brandColor")}
            </Label>
            <ColorPicker value={brandColor} onChange={setBrandColor} />
          </div>

          <Button
            onClick={() => createCompany.mutate()}
            disabled={!companyName.trim() || createCompany.isPending}
            className="w-full bg-[#00A3FF] hover:bg-[#00A3FF]/90 text-white font-medium"
          >
            {createCompany.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {t("onboarding.creating")}
              </>
            ) : (
              t("onboarding.createCompany")
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyOnboarding;
