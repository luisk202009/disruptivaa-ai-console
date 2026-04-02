import { Mail, Code, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const settingsCards = [
  {
    icon: <Mail size={22} strokeWidth={1.5} />,
    title: "Email",
    description: "Configura plantillas de correo electrónico y ajustes de envío.",
    path: "/admin/emails",
  },
  {
    icon: <Code size={22} strokeWidth={1.5} />,
    title: "Plantillas de Propuestas",
    description: "Edita las plantillas HTML utilizadas para generar propuestas comerciales.",
    path: "/admin/proposal-templates",
  },
];

const AdminSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">Ajustes</h1>
      <p className="text-sm text-muted-foreground mb-8">Configuración general del sistema.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="group text-left border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.03] transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-lg bg-white/[0.04] text-zinc-400 group-hover:text-foreground transition-colors">
                {card.icon}
              </div>
              <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">{card.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
