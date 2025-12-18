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
  onSuccess?: () => void;
}

const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#3D3D3D] border-[#EF7911]/30">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#EF7911]/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[#EF7911]" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Lleva tu marca al siguiente nivel
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Crea tu cuenta en Disruptivaa para que nuestros agentes guarden tu historial y analicen tus campañas reales
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <AuthForm 
            onSuccess={handleSuccess} 
            defaultTab="register" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

