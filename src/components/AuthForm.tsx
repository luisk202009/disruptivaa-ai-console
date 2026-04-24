import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSuccess?: () => void;
  // `defaultTab` se mantiene en la firma por compatibilidad pero el registro
  // público está desactivado: solo se muestra el formulario de inicio de sesión.
  defaultTab?: "login" | "register";
}

const getAuthErrorMessage = (error: any, t: (key: string) => string): string => {
  if (
    error?.status === 429 ||
    error?.message?.toLowerCase().includes("rate limit") ||
    error?.message?.toLowerCase().includes("too many")
  ) {
    return t("auth.rateLimitError");
  }
  return "";
};

const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState<"login" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "¡Bienvenido de vuelta!", description: "Has iniciado sesión correctamente." });
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      const rateLimitMsg = getAuthErrorMessage(error, t);
      let errorMessage = rateLimitMsg || "Ha ocurrido un error. Intenta de nuevo.";
      if (!rateLimitMsg && error.message?.includes("Invalid login credentials")) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      }
      toast({ title: "Error de autenticación", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: "https://app.disruptivaa.com/update-password",
      });
      if (error) throw error;
      toast({ title: t("auth.resetLinkSent") });
    } catch (error: any) {
      const rateLimitMsg = getAuthErrorMessage(error, t);
      toast({ title: "Error", description: rateLimitMsg || undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "pl-11 h-12 bg-zinc-900 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700/30 placeholder:text-zinc-600 text-white tracking-wide";
  const iconClassName = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600";

  if (view === "forgot") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setView("login")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          <ArrowLeft size={14} /> {t("auth.backToLogin")}
        </button>
        <div>
          <h3 className="text-white font-medium mb-1">{t("auth.forgotPassword")}</h3>
          <p className="text-zinc-500 text-sm">Te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="relative">
            <Mail className={iconClassName} strokeWidth={1.5} />
            <Input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className={inputClassName}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg tracking-wide"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("settings.sending")}
              </>
            ) : (
              t("auth.sendResetLink")
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-3">
          <Label htmlFor="login-email" className="text-zinc-400 text-sm tracking-wide">
            Email
          </Label>
          <div className="relative">
            <Mail className={iconClassName} strokeWidth={1.5} />
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className={inputClassName}
            />
          </div>
        </div>
        <div className="space-y-3">
          <Label htmlFor="login-password" className="text-zinc-400 text-sm tracking-wide">
            Contraseña
          </Label>
          <div className="relative">
            <Lock className={iconClassName} strokeWidth={1.5} />
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={inputClassName}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg tracking-wide transition-colors mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>

        <button
          type="button"
          onClick={() => setView("forgot")}
          className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {t("auth.forgotPassword")}
        </button>
      </form>

      <div className="pt-6 border-t border-zinc-800">
        <Link
          to="/lista-de-espera"
          className="flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={14} className="text-primary" />
            <div className="text-left">
              <p className="text-sm text-white font-medium tracking-wide">
                ¿Aún no tienes acceso?
              </p>
              <p className="text-xs text-zinc-500">Únete a la lista de espera</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-primary group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default AuthForm;
