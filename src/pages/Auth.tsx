import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-disruptivaa.png";
import AuthForm from "@/components/AuthForm";

const Auth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Back button - discreto */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-12 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="text-sm tracking-wide">Volver</span>
        </button>

        {/* Logo centrado */}
        <div className="flex justify-center mb-10">
          <img src={logo} alt="Disruptivaa" className="h-8" />
        </div>

        {/* Titulo - tipografia limpia */}
        <h1 className="text-2xl font-semibold text-white text-center mb-2 tracking-tight">
          Bienvenido
        </h1>
        <p className="text-zinc-500 text-center mb-10 text-sm tracking-wide">
          Accede a tus agentes AI y conecta tus campañas
        </p>

        {/* Contenedor del form - borde muy sutil */}
        <div className="rounded-xl border border-white/[0.05] bg-zinc-900/30 p-8">
          <AuthForm onSuccess={() => navigate("/dashboard")} defaultTab="login" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
