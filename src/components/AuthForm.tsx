import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, User, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSuccess?: () => void;
  defaultTab?: "login" | "register";
}

const AuthForm = ({ onSuccess, defaultTab = "login" }: AuthFormProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Ha ocurrido un error. Intenta de nuevo.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      console.error("Register error:", error);
      let errorMessage = "Ha ocurrido un error. Intenta de nuevo.";
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
      } else if (error.message?.includes("Password should be")) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      }
      
      toast({
        title: "Error de registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-[#EF7911]/20">
        <TabsTrigger 
          value="login" 
          className="data-[state=active]:bg-[#EF7911] data-[state=active]:text-white"
        >
          Iniciar sesión
        </TabsTrigger>
        <TabsTrigger 
          value="register"
          className="data-[state=active]:bg-[#EF7911] data-[state=active]:text-white"
        >
          Registrarse
        </TabsTrigger>
      </TabsList>

      {/* Login Tab */}
      <TabsContent value="login" className="mt-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="login-email"
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
            <Label htmlFor="login-password" className="text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="login-password"
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
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>
      </TabsContent>

      {/* Register Tab */}
      <TabsContent value="register" className="mt-6">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-name" className="text-foreground">
              Nombre
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="pl-10 bg-background/50 border-[#EF7911]/30 focus:border-[#EF7911] focus:ring-[#EF7911]/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="register-email"
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
            <Label htmlFor="register-password" className="text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="register-password"
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
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>

          {/* Benefits */}
          <div className="pt-4 border-t border-border/30 space-y-2">
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
        </form>
      </TabsContent>
    </Tabs>
  );
};

export default AuthForm;
