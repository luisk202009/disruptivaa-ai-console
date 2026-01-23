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
  Bot,
  Link2,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useConversations } from "@/hooks/useConversations";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { ProjectItemMenu } from "./ProjectItemMenu";
import { ConversationItemMenu } from "./ConversationItemMenu";
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
      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative",
      variant === "primary" 
        ? "bg-primary text-black font-semibold hover:bg-primary/90" 
        : "hover:bg-sidebar-accent/50",
      !active && variant === "default" && "text-sidebar-foreground hover:text-foreground"
    )}
  >
    {/* Active indicator - thin orange line */}
    {active && variant === "default" && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-full" />
    )}
    <span className={cn(
      "transition-colors",
      active && variant === "default" ? "text-foreground" : ""
    )}>
      {icon}
    </span>
    {!collapsed && (
      <span className={cn(
        "font-medium text-sm transition-colors",
        active && variant === "default" && "text-foreground"
      )}>
        {label}
      </span>
    )}
  </button>
);

// Store the active project in a way that can be accessed by other components
let activeProjectIdGlobal: string | null = null;
export const getActiveProjectId = () => activeProjectIdGlobal;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects();
  const { conversations, loading: conversationsLoading, deleteConversation, moveConversation } = useConversations(
    selectedProjectId !== undefined ? { projectId: selectedProjectId } : {}
  );

  // Update global ref when selectedProjectId changes
  activeProjectIdGlobal = selectedProjectId;

  const handleNewConversation = () => {
    navigate("/");
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  const handleLoadConversation = (chatId: string) => {
    navigate("/");
    window.dispatchEvent(new CustomEvent("loadConversation", { detail: { chatId } }));
  };

  const handleCreateProject = async (name: string) => {
    await createProject(name);
  };

  const handleRenameProject = async (id: string, name: string) => {
    await updateProject(id, name);
  };

  const handleDeleteProject = async (id: string, deleteConvos: boolean) => {
    await deleteProject(id, deleteConvos);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  const handleDeleteConversation = async (chatId: string) => {
    await deleteConversation(chatId);
  };

  const handleMoveConversation = async (chatId: string, projectId: string | null) => {
    await moveConversation(chatId, projectId);
  };

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: "Dashboard", path: "/" },
    { id: "panels", icon: <LayoutGrid size={18} strokeWidth={1.5} />, label: "Paneles", path: "/dashboards" },
    { id: "agents", icon: <Bot size={18} strokeWidth={1.5} />, label: "Agentes AI", path: "/agents" },
    { id: "history", icon: <History size={18} strokeWidth={1.5} />, label: "Historial", path: "/history" },
    { id: "connections", icon: <Link2 size={18} strokeWidth={1.5} />, label: "Conexiones", path: "/connections" },
    { id: "settings", icon: <Settings size={18} strokeWidth={1.5} />, label: "Configuración", path: "/settings" },
    { id: "help", icon: <HelpCircle size={18} strokeWidth={1.5} />, label: "Ayuda", path: "/" },
  ];

  const getActiveItem = () => {
    if (location.pathname === "/dashboards" || location.pathname.startsWith("/dashboards/")) return "panels";
    if (location.pathname === "/agents") return "agents";
    if (location.pathname === "/history") return "history";
    if (location.pathname === "/connections") return "connections";
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
        "h-screen bg-sidebar border-r border-white/[0.04] flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center transition-all duration-300",
        collapsed ? "justify-center px-2" : "px-5"
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
      <div className="px-4 py-3">
        <NavItem
          icon={<Plus size={18} strokeWidth={2} />}
          label="Nueva Conversación"
          collapsed={collapsed}
          onClick={handleNewConversation}
          variant="primary"
        />
      </div>

      {/* Navigation */}
      <nav className="px-4 py-4 space-y-1">
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

      {/* Projects Section */}
      {user && !collapsed && (
        <div className="px-4 mb-3">
          <div 
            className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-sidebar-accent/40 rounded-lg px-2 transition-colors"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
          >
            <div className="flex items-center gap-2">
              <Folder size={14} strokeWidth={1.5} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Proyectos
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateProject(true);
                }}
                className="p-1 rounded hover:bg-sidebar-accent transition-colors"
                title="Crear proyecto"
              >
                <Plus size={14} strokeWidth={1.5} className="text-muted-foreground" />
              </button>
              {projectsExpanded ? (
                <ChevronUp size={14} strokeWidth={1.5} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={14} strokeWidth={1.5} className="text-muted-foreground" />
              )}
            </div>
          </div>

          {projectsExpanded && (
            <div className="space-y-0.5 mt-1">
              {/* General / No Project option */}
              <button
                onClick={() => handleSelectProject(null)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                  selectedProjectId === null
                    ? "text-foreground"
                    : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/40"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderOpen size={14} strokeWidth={1.5} className={selectedProjectId === null ? "text-foreground" : "text-muted-foreground"} />
                  <span className="truncate">General</span>
                </div>
                {selectedProjectId === null && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>

              {/* Project list */}
              {projectsLoading ? (
                <p className="text-xs text-muted-foreground px-3 py-2.5">Cargando...</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors group cursor-pointer",
                      selectedProjectId === project.id
                        ? "text-foreground"
                        : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/40"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <Folder size={14} strokeWidth={1.5} className={selectedProjectId === project.id ? "text-foreground" : "text-muted-foreground"} />
                      <span className="truncate">{project.name}</span>
                    </div>
                    {selectedProjectId === project.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mr-1" />
                    )}
                    <ProjectItemMenu
                      project={project}
                      onRename={handleRenameProject}
                      onDelete={handleDeleteProject}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Conversations Section */}
      {user && !collapsed && (
        <div className="flex-1 overflow-hidden flex flex-col px-4">
          <div className="flex items-center gap-2 py-2.5 mb-2">
            <MessageSquare size={14} strokeWidth={1.5} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {selectedProjectId === null ? "Sin proyecto" : "Conversaciones"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {conversationsLoading ? (
              <p className="text-xs text-muted-foreground px-3 py-2.5">Cargando...</p>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2.5">Sin conversaciones</p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.chat_id}
                  onClick={() => handleLoadConversation(convo.chat_id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/40 transition-colors cursor-pointer group"
                >
                  <span className="truncate flex-1">{convo.title || "Sin título"}</span>
                  <ConversationItemMenu
                    conversation={convo}
                    projects={projects}
                    onDelete={handleDeleteConversation}
                    onMove={handleMoveConversation}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* User Section at Bottom */}
      {user && (
        <div className={cn(
          "p-4 border-t border-white/[0.04]",
          collapsed ? "flex justify-center" : ""
        )}>
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/40",
            collapsed && "justify-center p-2"
          )}>
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-200 shrink-0">
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
                <LogOut size={16} strokeWidth={1.5} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-4 border-t border-white/[0.04]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/40 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
          {!collapsed && <span className="text-sm">Colapsar</span>}
        </button>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
        onCreateProject={handleCreateProject}
      />
    </aside>
  );
};

export default Sidebar;
