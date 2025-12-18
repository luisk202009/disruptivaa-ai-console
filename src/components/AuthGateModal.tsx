import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock } from "lucide-react";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthGateModal = ({ open, onOpenChange }: AuthGateModalProps) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate("/auth");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#3D3D3D] border-[#EF7911]/30">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#EF7911]/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[#EF7911]" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            ¿Quieres que nuestros agentes analicen tus datos?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Crea tu cuenta para guardar tu historial y conectar tus campañas de
            Meta y Google Ads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Sparkles size={16} className="text-[#EF7911]" />
              <span>Acceso ilimitado a los 5 agentes AI</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Sparkles size={16} className="text-[#EF7911]" />
              <span>Historial de conversaciones guardado</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Sparkles size={16} className="text-[#EF7911]" />
              <span>Conecta tus cuentas publicitarias</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleLogin}
              className="w-full bg-[#EF7911] hover:bg-[#EF7911]/90 text-white font-semibold py-6"
            >
              Crear cuenta gratis
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Quizás después
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGateModal;
