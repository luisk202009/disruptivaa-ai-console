import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-disruptivaa.png";
import AuthForm from "@/components/AuthForm";

const Auth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3D3D3D] p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver al Dashboard</span>
        </button>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Disruptivaa" className="h-10" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Bienvenido a Disruptivaa
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Accede a tus agentes AI y conecta tus campañas
          </p>

          {/* Auth Form with Tabs */}
          <AuthForm onSuccess={() => navigate("/")} defaultTab="login" />
        </div>
      </div>
    </div>
  );
};

export default Auth;
