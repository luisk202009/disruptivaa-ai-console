import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, FolderInput } from "lucide-react";
import { MoveConversationDialog } from "./MoveConversationDialog";
import { Project } from "@/hooks/useProjects";
import { Conversation } from "@/hooks/useConversations";

interface ConversationItemMenuProps {
  conversation: Conversation;
  projects: Project[];
  onDelete: (chatId: string) => Promise<void>;
  onMove: (chatId: string, projectId: string | null) => Promise<void>;
}

export const ConversationItemMenu = ({ conversation, projects, onDelete, onMove }: ConversationItemMenuProps) => {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try { await onDelete(conversation.chat_id); setShowDeleteDialog(false); } finally { setLoading(false); }
  };

  const handleMove = async (projectId: string | null) => { await onMove(conversation.chat_id, projectId); };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowMoveDialog(true); }} className="cursor-pointer">
            <FolderInput className="h-4 w-4 mr-2" />
            {t("conversations.moveToProject")}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-700" />
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }} className="cursor-pointer text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t("conversations.deleteConversation")}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">{t("conversations.deleteConversationDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
              {loading ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveConversationDialog
        open={showMoveDialog} onOpenChange={setShowMoveDialog}
        conversationTitle={conversation.title || t("sidebar.untitled")}
        currentProjectId={conversation.project_id} projects={projects} onMoveConversation={handleMove}
      />
    </>
  );
};