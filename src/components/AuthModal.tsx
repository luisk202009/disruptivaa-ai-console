import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "¡Bienvenido de vuelta!",
          description: "Has iniciado sesión correctamente.",
        });
        onOpenChange(false);
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "¡Cuenta creada!",
          description: "Revisa tu email para confirmar tu cuenta.",
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = "Ha ocurrido un error. Intenta de nuevo.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
      } else if (error.message?.includes("Password should be")) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      }
      
      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#3D3D3D] border-[#EF7911]/30">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#EF7911]/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-[#EF7911]" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin
              ? "Accede a tus agentes AI y continúa donde lo dejaste"
              : "Crea tu cuenta para guardar tu historial y conectar tus campañas"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nombre
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="pl-10 bg-background/50 border-[#EF7911]/30 focus:border-[#EF7911] focus:ring-[#EF7911]/20"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="pl-10 bg-background/50 border-[#EF7911]/30 focus:border-[#EF7911] focus:ring-[#EF7911]/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10 bg-background/50 border-[#EF7911]/30 focus:border-[#EF7911] focus:ring-[#EF7911]/20"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#EF7911] hover:bg-[#EF7911]/90 text-white font-semibold py-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
              </>
            ) : isLogin ? (
              "Iniciar sesión"
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-muted-foreground hover:text-[#EF7911] transition-colors"
          >
            {isLogin ? (
              <>
                ¿No tienes cuenta?{" "}
                <span className="text-[#EF7911] font-medium">Regístrate</span>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{" "}
                <span className="text-[#EF7911] font-medium">Inicia sesión</span>
              </>
            )}
          </button>
        </div>

        {/* Benefits */}
        {!isLogin && (
          <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles size={12} className="text-[#EF7911]" />
              <span>Acceso a 5 agentes AI especializados</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles size={12} className="text-[#EF7911]" />
              <span>Historial de conversaciones guardado</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles size={12} className="text-[#EF7911]" />
              <span>Conecta Meta y Google Ads</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
