import { 
  LayoutDashboard, 
  Bot, 
  Settings, 
  History, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
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
