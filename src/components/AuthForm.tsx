import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, User } from "lucide-react";
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

  const inputClassName = "pl-11 h-12 bg-zinc-900 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700/30 placeholder:text-zinc-600 text-white tracking-wide";
  const iconClassName = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-zinc-800 rounded-none p-0 h-auto">
        <TabsTrigger 
          value="login" 
          className="rounded-none border-b-2 border-transparent py-3 text-zinc-500 
                     data-[state=active]:border-white data-[state=active]:text-white 
                     data-[state=active]:bg-transparent data-[state=active]:shadow-none
                     hover:text-zinc-300 transition-colors tracking-wide"
        >
          Iniciar sesión
        </TabsTrigger>
        <TabsTrigger 
          value="register"
          className="rounded-none border-b-2 border-transparent py-3 text-zinc-500 
                     data-[state=active]:border-white data-[state=active]:text-white 
                     data-[state=active]:bg-transparent data-[state=active]:shadow-none
                     hover:text-zinc-300 transition-colors tracking-wide"
        >
          Registrarse
        </TabsTrigger>
      </TabsList>

      {/* Login Tab */}
      <TabsContent value="login" className="mt-8">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="login-email" className="text-zinc-400 text-sm tracking-wide">
              Email
            </Label>
            <div className="relative">
              <Mail className={iconClassName} strokeWidth={1.5} />
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="login-password" className="text-zinc-400 text-sm tracking-wide">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className={iconClassName} strokeWidth={1.5} />
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={inputClassName}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold 
                       rounded-lg tracking-wide transition-colors mt-2"
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
      <TabsContent value="register" className="mt-8">
        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="register-name" className="text-zinc-400 text-sm tracking-wide">
              Nombre
            </Label>
            <div className="relative">
              <User className={iconClassName} strokeWidth={1.5} />
              <Input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="register-email" className="text-zinc-400 text-sm tracking-wide">
              Email
            </Label>
            <div className="relative">
              <Mail className={iconClassName} strokeWidth={1.5} />
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="register-password" className="text-zinc-400 text-sm tracking-wide">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className={iconClassName} strokeWidth={1.5} />
              <Input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={inputClassName}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold 
                       rounded-lg tracking-wide transition-colors mt-2"
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
          <div className="pt-6 border-t border-zinc-800 space-y-3">
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="tracking-wide">Acceso a 5 agentes AI especializados</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="tracking-wide">Historial de conversaciones guardado</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
              <span className="tracking-wide">Conecta Meta y Google Ads</span>
            </div>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
};

export default AuthForm;
