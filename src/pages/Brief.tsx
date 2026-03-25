import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Rocket, ShoppingBag, Users, ArrowLeft, Layout } from "lucide-react";
import PublicLayout from "@/components/landing/PublicLayout";
import DynamicBriefForm from "@/components/brief/DynamicBriefForm";
import { cn } from "@/lib/utils";

type ServiceType = string | null;

const options = [
  { id: "crm-hubspot", icon: Users, title: "CRM HubSpot", subtitle: "Implementación y adopción real", color: "text-primary", bgColor: "bg-primary/10" },
  { id: "14-dias", icon: Rocket, title: "Negocio en 14 días", subtitle: "Web + CRM + Pagos + Automatizaciones", color: "text-primary", bgColor: "bg-primary/10" },
  { id: "shopify", icon: ShoppingBag, title: "Shopify", subtitle: "E-commerce listo para vender", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { id: "marketing-ads", icon: Globe, title: "Marketing & Ads", subtitle: "Campañas multicanal con retorno", color: "text-primary", bgColor: "bg-primary/10" },
  { id: "website", icon: Layout, title: "Websites & Landings", subtitle: "Sitios web y landing pages de alta conversión", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "mvp", icon: Rocket, title: "MVP & Aplicaciones", subtitle: "Tu idea hecha producto digital en semanas", color: "text-violet-400", bgColor: "bg-violet-500/10" },
];

const Brief = () => {
  const [selected, setSelected] = useState<ServiceType>(null);
  const selectedOption = options.find((o) => o.id === selected);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="selector" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-14">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">Brief</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">¿Qué necesitas?</h1>
                <p className="text-muted-foreground">Seleccioná la categoría que mejor se ajuste a tu proyecto.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {options.map((opt) => (
                  <button key={opt.id} onClick={() => setSelected(opt.id)}
                    className={cn("group text-left rounded-2xl border border-border bg-card/40 p-10 transition-all duration-300", "hover:border-primary/30 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1")}>
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", opt.bgColor, opt.color)}>
                      <opt.icon size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{opt.title}</h3>
                    <p className="text-sm text-muted-foreground">{opt.subtitle}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft size={18} strokeWidth={1.5} />
                <span className="text-sm">Volver</span>
              </button>
              <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
                <div className="p-6 border-b border-border flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedOption?.bgColor, selectedOption?.color)}>
                    {selectedOption && <selectedOption.icon size={20} />}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedOption?.title}</h2>
                    <p className="text-xs text-muted-foreground">{selectedOption?.subtitle}</p>
                  </div>
                </div>
                <DynamicBriefForm serviceType={selected} serviceLabel={selectedOption?.title || ""} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
};

export default Brief;
