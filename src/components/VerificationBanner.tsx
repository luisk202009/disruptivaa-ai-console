import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VerificationBanner = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.email_confirmed_at || dismissed) return null;

  const handleResend = async () => {
    if (!user.email) return;
    setSending(true);
    try {
      await supabase.auth.resend({ type: "signup", email: user.email });
      toast.success(t("auth.verificationSent"));
    } catch {
      toast.error("Error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-center gap-3 text-sm">
      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
      <span className="text-amber-200">{t("auth.verifyEmail")}</span>
      <button
        onClick={handleResend}
        disabled={sending}
        className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 transition-colors"
      >
        {t("auth.resendVerification")}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="ml-auto text-amber-400/60 hover:text-amber-300 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default VerificationBanner;
