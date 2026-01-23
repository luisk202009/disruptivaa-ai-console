import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { RenameProjectDialog } from "./RenameProjectDialog";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { Project } from "@/hooks/useProjects";

interface ProjectItemMenuProps {
  project: Project;
  onRename: (id: string, name: string, color: string) => Promise<void>;
  onDelete: (id: string, deleteConversations: boolean) => Promise<void>;
}

export const ProjectItemMenu = ({
  project,
  onRename,
  onDelete,
}: ProjectItemMenuProps) => {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRename = async (name: string, color: string) => {
    await onRename(project.id, name, color);
  };

  const handleDelete = async (deleteConversations: boolean) => {
    await onDelete(project.id, deleteConversations);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowRenameDialog(true);
            }}
            className="cursor-pointer"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-700" />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <RenameProjectDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        projectName={project.name}
        projectColor={project.color}
        onRenameProject={handleRename}
      />

      {/* Delete Dialog */}
      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectName={project.name}
        onDeleteProject={handleDelete}
      />
    </>
  );
};
