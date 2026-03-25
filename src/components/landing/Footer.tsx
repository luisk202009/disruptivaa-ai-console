import { Link } from "react-router-dom";
import logo from "@/assets/logo-disruptivaa.png";

const Footer = () => (
  <footer className="border-t border-white/[0.06] bg-background">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <img src={logo} alt="Disruptivaa" className="h-6 mb-4" />
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Estrategia, gestión y datos para escalar tu negocio en canales digitales.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Soluciones</h4>
          <ul className="space-y-2.5">
            <li><Link to="/soluciones/gestion-canales" className="text-sm text-zinc-400 hover:text-white transition-colors">Gestión de Canales</Link></li>
            <li><Link to="/soluciones/data-analytics" className="text-sm text-zinc-400 hover:text-white transition-colors">Data Analytics</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">Plataforma</h4>
          <ul className="space-y-2.5">
            <li><Link to="/brief" className="text-sm text-zinc-400 hover:text-white transition-colors">Brief</Link></li>
            <li><Link to="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link></li>
            <li><Link to="/auth" className="text-sm text-zinc-400 hover:text-white transition-colors">Log In</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/[0.06] text-center">
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Disruptivaa. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
