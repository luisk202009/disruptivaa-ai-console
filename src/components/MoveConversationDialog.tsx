import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FolderInput, Folder, FolderOpen } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface MoveConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle: string;
  currentProjectId: string | null;
  projects: Project[];
  onMoveConversation: (projectId: string | null) => Promise<void>;
}

export const MoveConversationDialog = ({
  open,
  onOpenChange,
  conversationTitle,
  currentProjectId,
  projects,
  onMoveConversation,
}: MoveConversationDialogProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    currentProjectId || "general"
  );
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    const targetProjectId = selectedProjectId === "general" ? null : selectedProjectId;
    if (targetProjectId === currentProjectId) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      await onMoveConversation(targetProjectId);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FolderInput className="h-5 w-5 text-primary" />
            Mover Conversación
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4">
            Mover "<span className="text-foreground">{conversationTitle}</span>" a:
          </p>

          <RadioGroup
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
            className="space-y-2 max-h-[300px] overflow-y-auto"
          >
            {/* General option */}
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                selectedProjectId === "general"
                  ? "bg-primary/10 border-primary"
                  : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <RadioGroupItem value="general" id="general" />
              <Label htmlFor="general" className="cursor-pointer flex-1 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">General</span>
                <span className="text-xs text-muted-foreground">(sin proyecto)</span>
              </Label>
            </div>

            {/* Projects */}
            {projects.map((project) => (
              <div
                key={project.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  selectedProjectId === project.id
                    ? "bg-primary/10 border-primary"
                    : "bg-zinc-800 border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <RadioGroupItem value={project.id} id={project.id} />
                <Label
                  htmlFor={project.id}
                  className="cursor-pointer flex-1 flex items-center gap-2"
                >
                  <Folder className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{project.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700"
          >
            Cancelar
          </Button>
          <Button onClick={handleMove} disabled={loading}>
            {loading ? "Moviendo..." : "Mover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
