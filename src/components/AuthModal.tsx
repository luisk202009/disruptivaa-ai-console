import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import AuthForm from "./AuthForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#3D3D3D] border-[#EF7911]/30">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#EF7911]/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[#EF7911]" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Estás a un paso de la disrupción
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Regístrate para que nuestros agentes guarden tu historial y analicen tus campañas
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AuthForm 
            onSuccess={() => onOpenChange(false)} 
            defaultTab="register" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

