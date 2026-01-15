import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onDeleteProject: (deleteConversations: boolean) => Promise<void>;
}

export const DeleteProjectDialog = ({
  open,
  onOpenChange,
  projectName,
  onDeleteProject,
}: DeleteProjectDialogProps) => {
  const [deleteOption, setDeleteOption] = useState<"move" | "delete">("move");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDeleteProject(deleteOption === "delete");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Proyecto
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            ¿Estás seguro de que deseas eliminar el proyecto{" "}
            <strong className="text-foreground">"{projectName}"</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-3">
            ¿Qué deseas hacer con las conversaciones de este proyecto?
          </p>
          <RadioGroup
            value={deleteOption}
            onValueChange={(v) => setDeleteOption(v as "move" | "delete")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <RadioGroupItem value="move" id="move" />
              <Label htmlFor="move" className="cursor-pointer flex-1">
                <span className="text-foreground">Mover a "General"</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Las conversaciones se mantendrán sin proyecto asignado
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <RadioGroupItem value="delete" id="delete" />
              <Label htmlFor="delete" className="cursor-pointer flex-1">
                <span className="text-destructive">Eliminar todo</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Se eliminarán permanentemente todas las conversaciones
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-zinc-700">
            Cancelar
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? "Eliminando..." : "Eliminar Proyecto"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
