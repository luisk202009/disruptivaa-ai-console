import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, MoreVertical, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Sidebar from "@/components/Sidebar";
import { useDashboards, Dashboard } from "@/hooks/useDashboards";
import { CreateDashboardDialog } from "@/components/dashboards/CreateDashboardDialog";
import { RenameDashboardDialog } from "@/components/dashboards/RenameDashboardDialog";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const Dashboards = () => {
  const navigate = useNavigate();
  const { dashboards, loading, createDashboard, createDashboardFromTemplate, updateDashboard, deleteDashboard } = useDashboards();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);

  const handleCreate = async (name: string, description?: string, templateId?: string) => {
    let dashboard;
    if (templateId) {
      dashboard = await createDashboardFromTemplate(name, description, templateId);
    } else {
      dashboard = await createDashboard(name, description);
    }
    if (dashboard) {
      setShowCreateDialog(false);
      navigate(`/dashboards/${dashboard.id}`);
    }
  };

  const handleRename = async (name: string, description?: string) => {
    if (!selectedDashboard) return;
    await updateDashboard(selectedDashboard.id, { name, description });
    setShowRenameDialog(false);
    setSelectedDashboard(null);
  };

  const handleDelete = async () => {
    if (!selectedDashboard) return;
    await deleteDashboard(selectedDashboard.id);
    setShowDeleteDialog(false);
    setSelectedDashboard(null);
  };

  const openRenameDialog = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setShowRenameDialog(true);
  };

  const openDeleteDialog = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setShowDeleteDialog(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">Paneles</h1>
            <p className="text-muted-foreground mt-1">
              Crea dashboards personalizados con métricas de tus campañas
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus size={18} />
            Nuevo Panel
          </Button>
        </div>

        {/* Dashboard Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dashboards.length === 0 ? (
          <Card className="glass border-dashed border-white/[0.06]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <LayoutGrid size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No tienes paneles aún
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Crea tu primer panel personalizado para visualizar las métricas más importantes de tus campañas.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus size={18} />
                Crear mi primer panel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="glass cursor-pointer hover:border-white/[0.12] transition-all duration-200 group"
                onClick={() => navigate(`/dashboards/${dashboard.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{dashboard.name}</CardTitle>
                    {dashboard.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {dashboard.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(dashboard);
                        }}
                      >
                        <Pencil size={14} className="mr-2" />
                        Renombrar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(dashboard);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Creado{" "}
                    {formatDistanceToNow(new Date(dashboard.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CreateDashboardDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreate={handleCreate}
        />

        <RenameDashboardDialog
          open={showRenameDialog}
          onOpenChange={setShowRenameDialog}
          dashboard={selectedDashboard}
          onRename={handleRename}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar panel?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará "{selectedDashboard?.name}" y todos sus widgets. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Dashboards;
