import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const GOOGLE_OAUTH_EXCHANGE_URL = "https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/google-oauth-exchange";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle Google error response
      if (error) {
        console.error("Google OAuth error:", error, errorDescription);
        setStatus("error");
        setErrorMessage(errorDescription || "El usuario canceló la autorización");
        setTimeout(() => navigate("/connections"), 3000);
        return;
      }

      // Validate state (CSRF protection)
      const savedState = sessionStorage.getItem("google_oauth_state");
      if (!state || state !== savedState) {
        console.error("State mismatch - potential CSRF attack");
        setStatus("error");
        setErrorMessage("Error de seguridad: Estado no válido. Intenta conectar nuevamente.");
        setTimeout(() => navigate("/connections"), 3000);
        return;
      }

      // Clear stored state
      sessionStorage.removeItem("google_oauth_state");

      if (!code) {
        setStatus("error");
        setErrorMessage("No se recibió código de autorización de Google");
        setTimeout(() => navigate("/connections"), 3000);
        return;
      }

      try {
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus("error");
          setErrorMessage("No estás autenticado. Inicia sesión e intenta nuevamente.");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        // Get redirect URI (must match the one used in authorization)
        const redirectUri = `${window.location.origin}/auth/google/callback`;

        // Exchange code for token via Edge Function
        const response = await fetch(GOOGLE_OAUTH_EXCHANGE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Error al intercambiar el código");
        }

        // Success!
        setStatus("success");
        toast.success("✅ Cuenta de Google Ads vinculada correctamente.");
        
        setTimeout(() => navigate("/connections"), 2000);
      } catch (err) {
        console.error("Google OAuth exchange error:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Error al procesar la autorización");
        setTimeout(() => navigate("/connections"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass rounded-xl p-8 max-w-md w-full mx-4 text-center">
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Conectando con Google Ads...
            </h2>
            <p className="text-muted-foreground">
              Estamos validando tu autorización y obteniendo acceso a tu cuenta.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              ¡Conexión exitosa!
            </h2>
            <p className="text-muted-foreground">
              Tu cuenta de Google Ads ha sido vinculada correctamente. Redirigiendo...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Error de conexión
            </h2>
            <p className="text-muted-foreground mb-4">
              {errorMessage}
            </p>
            <p className="text-sm text-muted-foreground">
              Redirigiendo a Conexiones...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
