import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, ArrowRight, Check, BarChart3, Workflow, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";

const benefits = [
  { icon: Workflow, title: "Procesos comerciales claros", desc: "Pipeline personalizado, etapas definidas y seguimiento automático de cada oportunidad." },
  { icon: Users, title: "Adopción real del equipo", desc: "Capacitación práctica para que tu equipo use el CRM desde el día uno, sin excusas." },
  { icon: BarChart3, title: "Reportes que sirven", desc: "Dashboards con métricas de conversión, ciclo de venta y rendimiento por vendedor." },
  { icon: HeadphonesIcon, title: "Soporte continuo", desc: "Acompañamiento post-implementación para ajustar flujos y resolver dudas." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const CrmHubspot = () => (
  <PublicLayout>
    {/* Hero */}
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">CRM HubSpot</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            Un CRM que tu equipo <span className="text-primary">sí va a usar</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Configuramos, personalizamos y capacitamos a tu equipo en HubSpot para que cada lead tenga seguimiento y cada venta se cierre con proceso.
          </p>
          <Link to="/internal/brief-selector">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              Solicitar propuesta <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>

    {/* Beneficios */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">¿Qué incluye?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, i) => (
            <motion.div key={b.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="flex gap-5 p-6 rounded-2xl border border-border bg-card/40 hover:border-primary/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <b.icon size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Lo que resolvemos */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-8">Problemas que resolvemos</h2>
        <ul className="space-y-4 text-left max-w-lg mx-auto">
          {["Leads que se pierden porque nadie les da seguimiento", "Vendedores usando Excel o WhatsApp como CRM", "Sin visibilidad del pipeline ni métricas de conversión", "CRM implementado pero abandonado por el equipo"].map((item) => (
            <li key={item} className="flex items-start gap-3 text-muted-foreground">
              <Check size={18} className="text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <Link to="/internal/brief-selector">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              Empezar ahora <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default CrmHubspot;
