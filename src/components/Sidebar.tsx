import { 
  LayoutDashboard, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bot,
  Link2,
  ChevronUp,
  LayoutGrid,
  ShieldCheck,
  Globe,
  Wand2
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import NotificationCenter from "@/components/NotificationCenter";
import logo from "@/assets/logo-disruptivaa.png";
import isologo from "@/assets/isologo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  variant?: "default" | "primary";
}

const NavItem = ({ icon, label, active, collapsed, onClick, variant = "default" }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
      variant === "primary" 
        ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90" 
        : "hover:bg-white/[0.04]",
      !active && variant === "default" && "text-zinc-500 hover:text-zinc-200"
    )}
  >
    {active && variant === "default" && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00A3FF] rounded-full" />
    )}
    <span className={cn(
      "transition-colors",
      active && variant === "default" ? "text-foreground" : "group-hover:text-zinc-200"
    )}>
      {icon}
    </span>
    {!collapsed && (
      <span className={cn(
        "text-sm tracking-wide transition-colors",
        active && variant === "default" ? "text-foreground font-medium" : ""
      )}>
        {label}
      </span>
    )}
  </button>
);

// Kept for backward compatibility with CommandConsole
let activeProjectIdGlobal: string | null = null;
export const getActiveProjectId = () => activeProjectIdGlobal;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const { companyName } = useCompanyBranding();

  const topNavItems = [
    { id: "dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: t("navigation.dashboard"), path: "/dashboard" },
    { id: "panels", icon: <LayoutGrid size={18} strokeWidth={1.5} />, label: t("navigation.panels"), path: "/dashboards" },
  ];

  const getActiveItem = () => {
    if (location.pathname === "/admin") return "admin";
    if (location.pathname === "/dashboards" || location.pathname.startsWith("/dashboards/")) return "panels";
    if (location.pathname === "/agents") return "agents";
    if (location.pathname === "/landing-builder") return "landing-builder";
    if (location.pathname.startsWith("/project/")) return "project";
    if (location.pathname === "/websites") return "websites";
    if (location.pathname === "/connections") return "connections";
    return "dashboard";
  };

  const getUserDisplayName = () => {
    if (!user) return null;
    const metadata = user.user_metadata;
    return metadata?.full_name || user.email?.split("@")[0] || "Usuario";
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-white/[0.04] flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* ===== HEADER ===== */}
      <div className="shrink-0">
        <div className={cn(
          "h-16 flex items-center transition-all duration-300",
          collapsed ? "justify-center px-2" : "px-5"
        )}>
          {collapsed ? (
            <img src={isologo} alt="Disruptivaa" className="h-10 w-10 transition-all duration-300" />
          ) : (
            <img src={logo} alt="Disruptivaa" className="h-8 transition-all duration-300" />
          )}
        </div>
      </div>

      {/* ===== NAVIGATION ===== */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        <div className="h-full overflow-y-auto scrollbar-minimal">
          {/* Top Navigation */}
          <nav className="shrink-0 px-4 py-4 space-y-1">
            {topNavItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={getActiveItem() === item.id}
                collapsed={collapsed}
                onClick={() => navigate(item.path)}
              />
            ))}
          </nav>

          {/* ── SERVICIOS DE IA ── */}
          <div className="px-4 mt-6">
            {!collapsed && (
              <p className="text-[10px] font-bold font-['Fira_Sans'] uppercase tracking-[0.2em] text-zinc-500 px-3 mb-2">
                {t("navigation.aiServices")}
              </p>
            )}
            <NavItem
              icon={<Bot size={18} strokeWidth={1.5} />}
              label={t("navigation.agents")}
              active={getActiveItem() === "agents"}
              collapsed={collapsed}
              onClick={() => navigate("/agents")}
            />
            <NavItem
              icon={<Wand2 size={18} strokeWidth={1.5} />}
              label={t("landingBuilder.vibeBuilder")}
              active={getActiveItem() === "landing-builder"}
              collapsed={collapsed}
              onClick={() => navigate("/landing-builder")}
            />
          </div>

          {/* ── ECOSISTEMA DIGITAL ── */}
          <div className="px-4 mt-6 mb-6">
            {!collapsed && (
              <p className="text-[10px] font-bold font-['Fira_Sans'] uppercase tracking-[0.2em] text-zinc-500 px-3 mb-2">
                {t("navigation.digitalEcosystem")}
              </p>
            )}
            <NavItem
              icon={<Globe size={18} strokeWidth={1.5} />}
              label={t("navigation.websites")}
              active={getActiveItem() === "websites"}
              collapsed={collapsed}
              onClick={() => navigate("/websites")}
            />
            <NavItem
              icon={<Link2 size={18} strokeWidth={1.5} />}
              label={t("navigation.connections")}
              active={getActiveItem() === "connections"}
              collapsed={collapsed}
              onClick={() => navigate("/connections")}
            />
          </div>

          {/* ── NOTIFICACIONES ── */}
          <div className="px-4 mt-2 mb-6">
            <NotificationCenter collapsed={collapsed} />
          </div>
        </div>
      </div>

      {/* ===== FOOTER (Profile + Toggle) ===== */}
      <div className="shrink-0 border-t border-white/[0.05]">
        {user && (
          <div className={cn("px-4 py-3", collapsed && "flex justify-center")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    "hover:bg-white/[0.04] cursor-pointer",
                    collapsed && "justify-center p-2"
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-200 shrink-0" style={{ boxShadow: '0 0 0 1px var(--primary-company, #00A3FF)' }}>
                    {getUserDisplayName()?.charAt(0).toUpperCase()}
                  </div>
                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0 text-left">
                        {companyName && (
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">{companyName}</p>
                        )}
                        <p className="text-sm font-medium text-zinc-200 truncate tracking-wide">{getUserDisplayName()}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <ChevronUp size={14} strokeWidth={1.5} className="text-zinc-500" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56 bg-zinc-900/95 backdrop-blur-sm border-zinc-800/80 shadow-lg shadow-black/20"
              >
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => navigate("/admin")}
                      className="flex items-center gap-2.5 py-2.5 cursor-pointer text-zinc-400 hover:text-zinc-100 focus:text-zinc-100 focus:bg-white/[0.04] transition-colors"
                    >
                      <ShieldCheck size={16} strokeWidth={1.5} />
                      <span className="tracking-wide">{t("navigation.admin")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800/80" />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="flex items-center gap-2.5 py-2.5 cursor-pointer text-zinc-400 hover:text-zinc-100 focus:text-zinc-100 focus:bg-white/[0.04] transition-colors"
                >
                  <Settings size={16} strokeWidth={1.5} />
                  <span className="tracking-wide">{t("navigation.settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open("https://help.disruptivaa.com", "_blank")}
                  className="flex items-center gap-2.5 py-2.5 cursor-pointer text-zinc-400 hover:text-zinc-100 focus:text-zinc-100 focus:bg-white/[0.04] transition-colors"
                >
                  <HelpCircle size={16} strokeWidth={1.5} />
                  <span className="tracking-wide">{t("navigation.help")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800/80" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="flex items-center gap-2.5 py-2.5 cursor-pointer text-zinc-400 hover:text-red-400 focus:text-red-400 focus:bg-white/[0.04] transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  <span className="tracking-wide">{t("navigation.signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="px-3 pb-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;