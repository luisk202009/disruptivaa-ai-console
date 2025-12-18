import { 
  LayoutDashboard, 
  Settings, 
  History, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
  MessageSquare,
  Bot
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRecentConversations } from "@/hooks/useRecentConversations";
import logo from "@/assets/logo-disruptivaa.png";
import isologo from "@/assets/isologo.png";

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
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
      variant === "primary" 
        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
        : "hover:bg-sidebar-accent",
      active && variant === "default" && "bg-primary/10 text-primary border-l-2 border-primary",
      !active && variant === "default" && "text-sidebar-foreground"
    )}
  >
    <span className={cn(active && variant === "default" && "text-primary")}>{icon}</span>
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
  const { conversations, loading: conversationsLoading } = useRecentConversations();

  const handleNewConversation = () => {
    navigate("/");
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  const handleLoadConversation = (conversationId: string) => {
    navigate("/");
    window.dispatchEvent(new CustomEvent("loadConversation", { detail: { id: conversationId } }));
  };

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/" },
    { id: "agents", icon: <Bot size={20} />, label: "Agentes AI", path: "/agents" },
    { id: "history", icon: <History size={20} />, label: "Historial", path: "/history" },
    { id: "settings", icon: <Settings size={20} />, label: "Configuración", path: "/settings" },
    { id: "help", icon: <HelpCircle size={20} />, label: "Ayuda", path: "/" },
  ];

  const getActiveItem = () => {
    if (location.pathname === "/agents") return "agents";
    if (location.pathname === "/history") return "history";
    if (location.pathname === "/settings") return "settings";
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

      {/* New Conversation Button */}
      <div className="p-3">
        <NavItem
          icon={<Plus size={20} />}
          label="Nueva Conversación"
          collapsed={collapsed}
          onClick={handleNewConversation}
          variant="primary"
        />
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
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

      {/* Recent Conversations Section */}
      {user && !collapsed && (
        <div className="flex-1 overflow-hidden flex flex-col px-3">
          <div className="flex items-center gap-2 py-2 mb-1">
            <MessageSquare size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Conversaciones recientes
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {conversationsLoading ? (
              <p className="text-xs text-muted-foreground px-3 py-2">Cargando...</p>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">Sin conversaciones</p>
            ) : (
              conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => handleLoadConversation(convo.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors truncate"
                >
                  {convo.title}
                </button>
              ))
            )}
          </div>
        </div>
      )}

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
