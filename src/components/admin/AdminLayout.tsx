import { 
  Users, Building2, UserCog, CreditCard, Bell, Mail, FileText,
  ChevronLeft, ChevronRight, ArrowLeft
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRoles } from "@/hooks/useUserRoles";
import logo from "@/assets/logo-disruptivaa.png";
import isologo from "@/assets/isologo.png";
import { Loader2 } from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, collapsed, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
      "hover:bg-white/[0.04]",
      !active && "text-zinc-500 hover:text-zinc-200"
    )}
  >
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#00A3FF] rounded-full" />
    )}
    <span className={cn(
      "transition-colors",
      active ? "text-foreground" : "group-hover:text-zinc-200"
    )}>
      {icon}
    </span>
    {!collapsed && (
      <span className={cn(
        "text-sm tracking-wide transition-colors",
        active ? "text-foreground font-medium" : ""
      )}>
        {label}
      </span>
    )}
  </button>
);

const adminNavItems = [
  { id: "leads", icon: <Users size={18} strokeWidth={1.5} />, label: "Leads CRM", path: "/admin/leads" },
  { id: "companies", icon: <Building2 size={18} strokeWidth={1.5} />, label: "Empresas", path: "/admin/companies" },
  { id: "users", icon: <UserCog size={18} strokeWidth={1.5} />, label: "Usuarios", path: "/admin/users" },
  { id: "subscriptions", icon: <CreditCard size={18} strokeWidth={1.5} />, label: "Suscripciones", path: "/admin/subscriptions" },
  { id: "notifications", icon: <Bell size={18} strokeWidth={1.5} />, label: "Notificaciones", path: "/admin/notifications" },
  { id: "emails", icon: <Mail size={18} strokeWidth={1.5} />, label: "Email", path: "/admin/emails" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoading } = useUserRoles();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const getActiveItem = () => {
    for (const item of adminNavItems) {
      if (location.pathname === item.path || location.pathname.startsWith(item.path + "/")) {
        return item.id;
      }
    }
    return "";
  };

  return (
    <div className="flex min-h-screen bg-background font-['Fira_Sans',sans-serif]">
      <aside
        className={cn(
          "h-screen bg-sidebar border-r border-white/[0.04] flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
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

        {/* Back to app */}
        <div className="shrink-0 px-4 pb-2">
          <button
            onClick={() => navigate("/dashboard")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
            )}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
            {!collapsed && <span className="text-sm tracking-wide">Volver a la app</span>}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden relative min-h-0">
          <div className="h-full overflow-y-auto scrollbar-minimal">
            <nav className="px-4 py-4 space-y-1">
              {!collapsed && (
                <p className="text-[10px] font-bold font-['Fira_Sans'] uppercase tracking-[0.2em] text-zinc-500 px-3 mb-2">
                  Administración
                </p>
              )}
              {adminNavItems.map((item) => (
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
          </div>
        </div>

        {/* Footer - collapse toggle */}
        <div className="shrink-0 border-t border-white/[0.05]">
          <div className="px-3 py-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
            >
              {collapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
