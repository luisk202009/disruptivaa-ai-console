import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo-disruptivaa.png";

const UpdatePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check if already in recovery (hash tokens auto-processed)
    setReady(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Clean hash before redirecting
      if (window.location.hash) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      toast({ title: t("auth.passwordUpdated") });
      navigate("/");
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.toLowerCase().includes('rate limit');
      toast({ title: "Error", description: isRateLimit ? t("auth.rateLimitError") : undefined, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "pl-11 h-12 bg-zinc-900 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700/30 placeholder:text-zinc-600 text-white tracking-wide";
  const iconClassName = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate("/auth")} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-12 transition-colors">
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="text-sm tracking-wide">{t("auth.backToLogin")}</span>
        </button>

        <div className="flex justify-center mb-10">
          <img src={logo} alt="Disruptivaa" className="h-8" />
        </div>

        <h1 className="text-2xl font-semibold text-white text-center mb-2 tracking-tight">
          {t("auth.updatePassword")}
        </h1>
        <p className="text-zinc-500 text-center mb-10 text-sm tracking-wide">
          {t("auth.newPassword")}
        </p>

        <div className="rounded-xl border border-white/[0.05] bg-zinc-900/30 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="new-password" className="text-zinc-400 text-sm tracking-wide">
                {t("auth.newPassword")}
              </Label>
              <div className="relative">
                <Lock className={iconClassName} strokeWidth={1.5} />
                <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className={inputClassName} />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirm-password" className="text-zinc-400 text-sm tracking-wide">
                {t("auth.confirmPassword")}
              </Label>
              <div className="relative">
                <Lock className={iconClassName} strokeWidth={1.5} />
                <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6} className={inputClassName} />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg tracking-wide transition-colors mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("auth.updatePassword")}</> : t("auth.updatePassword")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
