import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const META_OAUTH_EXCHANGE_URL = "https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/meta-oauth-exchange";

const MetaCallback = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setErrorMessage(t("connections.errorCancelled"));
        setTimeout(() => navigate("/connections"), 3000);
        return;
      }

      const savedState = sessionStorage.getItem("meta_oauth_state");
      if (!state || state !== savedState) {
        setStatus("error");
        setErrorMessage(t("connections.errorSecurity"));
        setTimeout(() => navigate("/connections"), 3000);
        return;
      }
      sessionStorage.removeItem("meta_oauth_state");

      if (!code) {
        setStatus("error");
        setErrorMessage(t("connections.errorNoCode"));
        setTimeout(() => navigate("/connections"), 3000);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus("error");
          setErrorMessage(t("connections.errorAuth"));
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        const redirectUri = `${window.location.origin}/auth/meta/callback`;
        const response = await fetch(META_OAUTH_EXCHANGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || t("connections.errorExchange"));
        }

        setStatus("success");
        toast.success(`✅ ${t("connections.metaSuccess", { count: result.accountsCount || 0 })}`);
        setTimeout(() => navigate("/connections"), 2000);
      } catch (err) {
        console.error("OAuth exchange error:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : t("connections.errorExchange"));
        setTimeout(() => navigate("/connections"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass rounded-xl p-8 max-w-md w-full mx-4 text-center">
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t("connections.processingMeta")}</h2>
            <p className="text-muted-foreground">{t("connections.processingMetaDesc")}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t("connections.successTitle")}</h2>
            <p className="text-muted-foreground">{t("connections.successMeta")}</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t("connections.errorTitle")}</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">{t("connections.redirecting")}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MetaCallback;
