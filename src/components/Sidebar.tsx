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
      "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative group",
      variant === "primary" 
        ? "bg-primary text-black font-semibold hover:bg-primary/90" 
        : "hover:bg-white/[0.04]",
      !active && variant === "default" && "text-zinc-500 hover:text-zinc-200"
    )}
  >
    {/* Active indicator - thin gray line (not orange) */}
    {active && variant === "default" && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-zinc-400 rounded-full" />
    )}
    <span className={cn(
      "transition-colors",
      active && variant === "default" ? "text-white" : "group-hover:text-zinc-200"
    )}>
      {icon}
    </span>
    {!collapsed && (
      <span className={cn(
        "text-sm tracking-wide transition-colors",
        active && variant === "default" ? "text-white font-medium" : ""
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

  // Navigation items - Only main navigation (4 items)
  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: "Dashboard", path: "/" },
    { id: "panels", icon: <LayoutGrid size={18} strokeWidth={1.5} />, label: "Paneles", path: "/dashboards" },
    { id: "agents", icon: <Bot size={18} strokeWidth={1.5} />, label: "Agentes AI", path: "/agents" },
    { id: "history", icon: <History size={18} strokeWidth={1.5} />, label: "Historial", path: "/history" },
  ];

  const getActiveItem = () => {
    if (location.pathname === "/dashboards" || location.pathname.startsWith("/dashboards/")) return "panels";
    if (location.pathname === "/agents") return "agents";
    if (location.pathname === "/history") return "history";
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

      {/* Navigation - Main Group (4 items only) */}
      <nav className="px-4 py-4 space-y-1.5">
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

      {/* Projects Section - With mt-8 for generous separation */}
      {user && !collapsed && (
        <div className="px-4 mt-8 mb-3">
          <div className="flex items-center justify-between py-2.5">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
            >
              {projectsExpanded ? (
                <ChevronDown size={14} strokeWidth={1.5} />
              ) : (
                <ChevronRight size={14} strokeWidth={1.5} />
              )}
              Proyectos
            </button>
            <button
              onClick={() => setShowCreateProject(true)}
              className="p-1 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>

          {projectsExpanded && (
            <div className="space-y-1 mt-2">
              {/* General / No Project option */}
              <button
                onClick={() => handleSelectProject(null)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                  selectedProjectId === null
                    ? "text-white bg-white/[0.05]"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <FolderOpen size={14} strokeWidth={1.5} className="shrink-0" />
                  <span className="truncate tracking-wide">General</span>
                </div>
                {selectedProjectId === null && (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                )}
              </button>

              {/* Project list */}
              {projectsLoading ? (
                <p className="text-xs text-zinc-600 px-3 py-2.5 tracking-wide">Cargando...</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleSelectProject(project.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors group cursor-pointer",
                      selectedProjectId === project.id
                        ? "text-white bg-white/[0.05]"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <Folder size={14} strokeWidth={1.5} className="shrink-0" />
                      <span className="truncate tracking-wide">{project.name}</span>
                    </div>
                    {selectedProjectId === project.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mr-1" />
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
            <MessageSquare size={14} strokeWidth={1.5} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
              {selectedProjectId === null ? "Sin proyecto" : "Conversaciones"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {conversationsLoading ? (
              <p className="text-xs text-zinc-600 px-3 py-2.5 tracking-wide">Cargando...</p>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-zinc-600 px-3 py-2.5 tracking-wide">Sin conversaciones</p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.chat_id}
                  onClick={() => handleLoadConversation(convo.chat_id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <span className="truncate flex-1 tracking-wide">{convo.title || "Sin título"}</span>
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

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Profile Dropdown - User section with menu */}
      {user && (
        <div className={cn("p-4", collapsed ? "flex justify-center" : "")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  "hover:bg-white/[0.04] cursor-pointer",
                  collapsed && "justify-center p-2"
                )}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-300 shrink-0">
                  {getUserDisplayName()?.charAt(0).toUpperCase()}
                </div>

                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-zinc-200 truncate tracking-wide">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {user.email}
                      </p>
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
              className="w-56 bg-zinc-900 border-zinc-800"
            >
              <DropdownMenuItem
                onClick={() => navigate("/connections")}
                className="flex items-center gap-2 py-2.5 cursor-pointer text-zinc-300 hover:text-white focus:text-white focus:bg-white/[0.04]"
              >
                <Link2 size={16} strokeWidth={1.5} />
                <span className="tracking-wide">Gestionar Conexiones</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="flex items-center gap-2 py-2.5 cursor-pointer text-zinc-300 hover:text-white focus:text-white focus:bg-white/[0.04]"
              >
                <Settings size={16} strokeWidth={1.5} />
                <span className="tracking-wide">Configuración de Cuenta</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => window.open("https://help.disruptivaa.com", "_blank")}
                className="flex items-center gap-2 py-2.5 cursor-pointer text-zinc-300 hover:text-white focus:text-white focus:bg-white/[0.04]"
              >
                <HelpCircle size={16} strokeWidth={1.5} />
                <span className="tracking-wide">Centro de Ayuda</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800" />

              <DropdownMenuItem
                onClick={signOut}
                className="flex items-center gap-2 py-2.5 cursor-pointer text-zinc-400 hover:text-red-400 focus:text-red-400 focus:bg-white/[0.04]"
              >
                <LogOut size={16} strokeWidth={1.5} />
                <span className="tracking-wide">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-4 border-t border-white/[0.04]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
        >
          {collapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
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
