import { 
  LayoutDashboard, 
  Settings, 
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
  LayoutGrid,
  Search,
  X,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useProjects } from "@/hooks/useProjects";
import { useConversations } from "@/hooks/useConversations";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
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
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
      variant === "primary" 
        ? "bg-primary text-primary-foreground font-semibold hover:bg-primary/90" 
        : "hover:bg-white/[0.04]",
      !active && variant === "default" && "text-zinc-500 hover:text-zinc-200"
    )}
  >
    {/* Active indicator - thin gray line */}
    {active && variant === "default" && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-zinc-400 rounded-full" />
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

// Store the active project in a way that can be accessed by other components
let activeProjectIdGlobal: string | null = null;
export const getActiveProjectId = () => activeProjectIdGlobal;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const { companyName } = useCompanyBranding();
  const { projects, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects();
  const { 
    conversations, 
    loading: conversationsLoading, 
    loadingMore,
    hasMore,
    loadMore,
    deleteConversation, 
    moveConversation 
  } = useConversations(
    selectedProjectId !== undefined ? { projectId: selectedProjectId } : {}
  );

  // Update global ref when selectedProjectId changes
  activeProjectIdGlobal = selectedProjectId;

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(convo => 
      convo.title?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const threshold = 100;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    
    if (isNearBottom && hasMore && !loadingMore && !searchQuery) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore, searchQuery]);

  const handleNewConversation = () => {
    navigate("/agents");
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  const handleLoadConversation = (chatId: string) => {
    navigate("/agents");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("loadConversation", { detail: { chatId } }));
    }, 100);
  };

  const handleCreateProject = async (name: string, color: string) => {
    await createProject(name, color);
  };

  const handleRenameProject = async (id: string, name: string, color: string) => {
    await updateProject(id, { name, color });
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
    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      setSelectedProjectId(null);
    }
  };

  // Navigation items - Only main navigation (3 items)
  const navItems = [
    { id: "dashboard", icon: <LayoutDashboard size={18} strokeWidth={1.5} />, label: t("navigation.dashboard"), path: "/" },
    { id: "panels", icon: <LayoutGrid size={18} strokeWidth={1.5} />, label: t("navigation.panels"), path: "/dashboards" },
    { id: "agents", icon: <Bot size={18} strokeWidth={1.5} />, label: t("navigation.agents"), path: "/agents" },
    ...(isAdmin ? [
      { id: "admin", icon: <ShieldCheck size={18} strokeWidth={1.5} />, label: t("navigation.admin"), path: "/admin" }
    ] : []),
  ];

  const getActiveItem = () => {
    if (location.pathname === "/admin") return "admin";
    if (location.pathname === "/dashboards" || location.pathname.startsWith("/dashboards/")) return "panels";
    if (location.pathname === "/agents") return "agents";
    if (location.pathname === "/conversations") return "conversations";
    if (location.pathname.startsWith("/project/")) return "project";
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
      {/* ===== HEADER FIJO ===== */}
      <div className="shrink-0">
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

        {/* Search Input - Fixed in header */}
        {user && !collapsed && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search 
                size={14} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("sidebar.searchConversations")}
                className="w-full pl-9 pr-8 py-2 bg-white/[0.03] border border-white/[0.06] 
                  rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600
                  focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04]
                  transition-all duration-200"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== AREA SCROLLABLE CON GRADIENTES ===== */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {/* Gradient fade top */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-sidebar-background to-transparent z-10 pointer-events-none" />
        
        {/* Contenido scrollable */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-minimal"
        >
          {/* Navigation - Main Group */}
          <nav className="shrink-0 px-4 py-4 space-y-1">
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
            <div className="shrink-0 px-4 mt-3 mb-3">
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={() => setProjectsExpanded(!projectsExpanded)}
                  className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
                >
                  {projectsExpanded ? (
                    <ChevronDown size={14} strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={14} strokeWidth={1.5} />
                  )}
                  {t("navigation.projects")}
                </button>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="p-1 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>

              {projectsExpanded && (
                <div className="space-y-0.5 mt-1">
                  {/* General / No Project option */}
                  <button
                    onClick={() => handleSelectProject(null)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors group",
                      selectedProjectId === null
                        ? "text-foreground bg-white/[0.05]"
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
                    <p className="text-xs text-muted-foreground px-3 py-2 tracking-wide">{t("common.loading")}</p>
                  ) : (
                    filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => handleSelectProject(project.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors group cursor-pointer",
                          selectedProjectId === project.id
                            ? "text-foreground bg-white/[0.05]"
                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate flex-1">
                          <Folder size={14} strokeWidth={1.5} className="shrink-0" style={{ color: project.color }} />
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

          {/* Recent Conversations */}
          {user && !collapsed && (
            <div className="px-4 pb-6">
              <div className="flex items-center gap-2 py-2 shrink-0">
                <MessageSquare size={14} strokeWidth={1.5} className="text-zinc-500" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                  {t("navigation.recentConversations")}
                </span>
              </div>
              {conversationsLoading ? (
                <p className="text-xs text-muted-foreground px-3 py-2 tracking-wide">{t("common.loading")}</p>
              ) : filteredConversations.length === 0 ? (
                <p className="text-xs text-zinc-600 px-3 py-4 text-center">
                  {searchQuery 
                    ? t("sidebar.noResults") 
                    : t("sidebar.noConversations")
                  }
                </p>
              ) : (
                <div className="space-y-0.5">
                  {filteredConversations.map((convo, index) => (
                    <div
                      key={convo.chat_id}
                      onClick={() => handleLoadConversation(convo.chat_id)}
                      className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm leading-relaxed text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group animate-fade-in"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      {/* Project color badge - more subtle */}
                      {convo.project && (
                        <span 
                          className="w-2 h-2 rounded-full shrink-0 opacity-70"
                          style={{ backgroundColor: convo.project.color }}
                        />
                      )}
                      <span className="truncate flex-1 tracking-wide">
                        {convo.title || t("sidebar.untitled")}
                      </span>
                      <ConversationItemMenu
                        conversation={convo}
                        projects={projects}
                        onDelete={handleDeleteConversation}
                        onMove={handleMoveConversation}
                      />
                    </div>
                  ))}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-zinc-500" />
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasMore && conversations.length > 0 && !searchQuery && (
                    <p className="text-xs text-zinc-600 text-center py-3">
                      {t("sidebar.endOfList")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Gradient fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-sidebar-background to-transparent z-10 pointer-events-none" />
      </div>

      {/* ===== FOOTER FIJO (Perfil + Toggle) ===== */}
      <div className="shrink-0 border-t border-white/[0.05]">
        {/* Profile Section */}
        {user && (
          <div className={cn(
            "px-4 py-3",
            collapsed && "flex justify-center"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    "hover:bg-white/[0.04] cursor-pointer",
                    collapsed && "justify-center p-2"
                  )}
                >
                  {/* Avatar with gradient */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-200 shrink-0" style={{ boxShadow: '0 0 0 1px var(--primary-company, #00A3FF)' }}>
                    {getUserDisplayName()?.charAt(0).toUpperCase()}
                  </div>

                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0 text-left">
                        {companyName && (
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">
                            {companyName}
                          </p>
                        )}
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
                className="w-56 bg-zinc-900/95 backdrop-blur-sm border-zinc-800/80 shadow-lg shadow-black/20"
              >
                <DropdownMenuItem
                  onClick={() => navigate("/connections")}
                  className="flex items-center gap-2.5 py-2.5 cursor-pointer text-zinc-400 hover:text-zinc-100 focus:text-zinc-100 focus:bg-white/[0.04] transition-colors"
                >
                  <Link2 size={16} strokeWidth={1.5} />
                  <span className="tracking-wide">{t("navigation.connections")}</span>
                </DropdownMenuItem>

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

        {/* Collapse Toggle */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
          </button>
        </div>
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
