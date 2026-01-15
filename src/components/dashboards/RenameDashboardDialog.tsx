import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dashboard } from "@/hooks/useDashboards";

interface RenameDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: Dashboard | null;
  onRename: (name: string, description?: string) => Promise<void>;
}

export const RenameDashboardDialog = ({
  open,
  onOpenChange,
  dashboard,
  onRename,
}: RenameDashboardDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dashboard) {
      setName(dashboard.name);
      setDescription(dashboard.description || "");
    }
  }, [dashboard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onRename(name.trim(), description.trim() || undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar panel</DialogTitle>
          <DialogDescription>
            Modifica el nombre y descripción de tu panel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-name">Nombre</Label>
              <Input
                id="rename-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi panel de métricas"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rename-description">Descripción (opcional)</Label>
              <Textarea
                id="rename-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Panel para monitorear el rendimiento de campañas..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
