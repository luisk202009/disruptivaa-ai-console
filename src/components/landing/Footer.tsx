import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import logo from "@/assets/logo-disruptivaa.png";

const locations = [
  { city: "Pereira", country: "Colombia" },
  { city: "Foz", country: "España" },
  { city: "Guimarães", country: "Portugal" },
];

const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <img src={logo} alt="Disruptivaa" className="h-6 mb-4" />
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Integración de estrategia, tecnología y automatización para negocios que quieren escalar con orden.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Servicios</h4>
          <ul className="space-y-2.5">
            <li><Link to="/servicios/crm-hubspot" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CRM que sí se usa</Link></li>
            <li><Link to="/servicios/negocio-14-dias" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Negocio en 14 días</Link></li>
            <li><Link to="/servicios/shopify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Shopify</Link></li>
            <li><Link to="/servicios/marketing-ads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Marketing & Ads</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Plataforma</h4>
          <ul className="space-y-2.5">
            <li><Link to="/internal/brief-selector" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Brief</Link></li>
            <li><Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
            <li><Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log In</Link></li>
          </ul>
        </div>
      </div>

      {/* Locations */}
      <div className="mt-10 pt-6 border-t border-border">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {locations.map((loc) => (
            <div key={loc.city} className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={12} className="text-primary" />
              <span>{loc.city}, {loc.country}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} Disruptivaa. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
