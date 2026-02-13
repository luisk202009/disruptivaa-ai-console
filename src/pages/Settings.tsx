import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon, User, Bell, Palette, Shield, Mail, Calendar, MessageSquare, Activity, Key } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useUserProfile } from "@/hooks/useUserProfile";

interface UserStats {
  totalMessages: number;
  userMessages: number;
  lastMessageDate: string | null;
}

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [stats, setStats] = useState<UserStats>({
    totalMessages: 0,
    userMessages: 0,
    lastMessageDate: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [sendingReset, setSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setSendingReset(false);
    
    if (error) {
      toast.error(t("settings.resetError"));
    } else {
      toast.success(t("settings.resetSuccess"));
    }
  };

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) {
        setLoadingStats(false);
        return;
      }

      try {
        // Fetch total messages count
        const { count: totalCount } = await supabase
          .from("agent_messages")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch user messages count
        const { count: userCount } = await supabase
          .from("agent_messages")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("role", "user");

        // Fetch last message
        const { data: lastMessage } = await supabase
          .from("agent_messages")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        setStats({
          totalMessages: totalCount || 0,
          userMessages: userCount || 0,
          lastMessageDate: lastMessage?.created_at || null,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const getLocale = () => {
    const localeMap: Record<string, string> = { es: "es-ES", en: "en-US", pt: "pt-BR" };
    return localeMap[i18n.language] || "es-ES";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("settings.noActivity");
    return new Date(dateString).toLocaleDateString(getLocale(), {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAccountAge = () => {
    if (!user?.created_at) return t("settings.noActivity");
    return new Date(user.created_at).toLocaleDateString(getLocale(), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="text-primary" size={28} />
            <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          </div>

          <div className="space-y-4">
            {/* Perfil de Usuario - Expandido */}
            <div className="p-5 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <User className="text-primary-foreground" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{t("settings.profile")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.yourInfo")}</p>
                </div>
              </div>

              {user ? (
                <div className="space-y-4">
                  {/* Información básica */}
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="text-muted-foreground" size={18} />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("settings.email")}</p>
                        <p className="text-sm font-medium text-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="text-muted-foreground" size={18} />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("settings.memberSince")}</p>
                        <p className="text-sm font-medium text-foreground">{getAccountAge()}</p>
                      </div>
                    </div>
                    {/* Language Selector */}
                    <LanguageSelector />
                  </div>

                  {/* Estadísticas de actividad */}
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="text-primary" size={18} />
                      <h4 className="font-medium text-foreground">{t("settings.activitySummary")}</h4>
                    </div>
                    
                    {loadingStats ? (
                      <div className="text-sm text-muted-foreground">{t("settings.loadingStats")}</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="text-primary" size={16} />
                            <span className="text-2xl font-bold text-primary">{stats.totalMessages}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{t("settings.totalMessages")}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2">
                            <User className="text-primary" size={16} />
                            <span className="text-2xl font-bold text-primary">{stats.userMessages}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{t("settings.sentMessages")}</p>
                        </div>
                        <div className="col-span-2 p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">{t("settings.lastActivity")}</p>
                          <p className="text-sm font-medium text-foreground">{formatDate(stats.lastMessageDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("settings.loginToView")}</p>
              )}
            </div>

            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="text-muted-foreground" size={20} />
                <div>
                  <h3 className="font-medium text-foreground">{t("settings.notifications")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.notificationsDesc")}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Palette className="text-muted-foreground" size={20} />
                <div>
                  <h3 className="font-medium text-foreground">{t("settings.appearance")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-muted-foreground" size={20} />
                <div>
                  <h3 className="font-medium text-foreground">{t("settings.security")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.securityDesc")}</p>
                </div>
              </div>
              
              {user ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("settings.passwordResetEmail")} <span className="font-medium text-foreground">{user.email}</span> {t("settings.passwordResetLink")}
                  </p>
                  <Button 
                    onClick={handlePasswordReset} 
                    disabled={sendingReset}
                    variant="outline"
                    className="gap-2"
                  >
                    <Key size={16} />
                    {sendingReset ? t("settings.sending") : t("settings.changePassword")}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("settings.loginToChange")}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
