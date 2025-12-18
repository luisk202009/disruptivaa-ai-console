import { 
  LayoutDashboard, 
  Bot, 
  Settings, 
  History, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-disruptivaa.png";
import isologo from "@/assets/isologo.png";

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
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
      "hover:bg-sidebar-accent",
      active && "bg-primary/10 text-primary border-l-2 border-primary",
      !active && "text-sidebar-foreground"
    )}
  >
    <span className={cn(active && "text-primary")}>{icon}</span>
    {!collapsed && (
      <span className="font-medium text-sm">{label}</span>
    )}
  </button>
);

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/" },
    { id: "agents", icon: <Bot size={20} />, label: "Agentes AI", path: "/" },
    { id: "history", icon: <History size={20} />, label: "Historial", path: "/history" },
    { id: "settings", icon: <Settings size={20} />, label: "Configuración", path: "/settings" },
    { id: "help", icon: <HelpCircle size={20} />, label: "Ayuda", path: "/" },
  ];

  const getActiveItem = () => {
    if (location.pathname === "/history") return "history";
    if (location.pathname === "/settings") return "settings";
    return "dashboard";
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return null;
    const metadata = user.user_metadata;
    return metadata?.full_name || user.email?.split("@")[0] || "Usuario";
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border transition-all duration-300",
        collapsed ? "justify-center px-2" : "px-4"
      )}>
        {collapsed ? (
          <img 
            src={isologo} 
            alt="Disruptivaa" 
            className="h-10 w-10 transition-all duration-300"
          />
        ) : (
          <img 
            src={logo} 
            alt="Disruptivaa" 
            className="h-8 transition-all duration-300"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
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

      {/* User Section at Bottom */}
      {user && (
        <div className={cn(
          "p-3 border-t border-sidebar-border",
          collapsed ? "flex justify-center" : ""
        )}>
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50",
            collapsed && "justify-center p-2"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-primary-foreground shrink-0">
              {getUserDisplayName()?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={signOut}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
