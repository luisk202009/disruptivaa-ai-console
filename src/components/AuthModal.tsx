import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1f1f1f] border-primary/30">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Acceso por invitación
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Disruptivaa está abierto por invitación. Únete a la lista de espera y
            obtén hasta <span className="text-foreground font-medium">1 año de
            servicio sin costo</span> al ser seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <Link to="/lista-de-espera" onClick={() => onOpenChange(false)}>
            <Button className="w-full" size="lg">
              Únete a la lista de espera
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
          <Link
            to="/auth"
            onClick={() => onOpenChange(false)}
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ya tengo acceso → Iniciar sesión
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
