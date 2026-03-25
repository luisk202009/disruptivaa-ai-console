import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, Unplug, UserX, FileX, Target, Eye, CreditCard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";
import BentoGrid from "@/components/landing/BentoGrid";
import ContactForm from "@/components/landing/ContactForm";

const painPoints = [
  { icon: AlertTriangle, title: "Leads dispersos", desc: "Contactos en WhatsApp, Excel, email… sin seguimiento real." },
  { icon: Unplug, title: "Herramientas desconectadas", desc: "Cada plataforma por su lado. Cero visibilidad del proceso completo." },
  { icon: UserX, title: "CRM sin uso", desc: "Lo contrataste pero nadie lo usa. Los datos no se cargan." },
  { icon: FileX, title: "Páginas que no convierten", desc: "Tu web existe, pero no genera leads ni ventas reales." },
];

const valuePillars = [
  { icon: Target, title: "Captar", desc: "Páginas que convierten y campañas que atraen leads calificados." },
  { icon: Eye, title: "Seguir", desc: "CRM adoptado y automatizaciones que no dejan escapar oportunidades." },
  { icon: CreditCard, title: "Cobrar", desc: "Pasarelas de pago integradas y procesos de cierre optimizados." },
  { icon: TrendingUp, title: "Escalar", desc: "Dashboards, datos y automatización para crecer sin caos." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Landing = () => (
  <PublicLayout>
    {/* ── HERO ── */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.06] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-36 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
            Negocios que venden, operan y crecen{" "}
            <span className="text-primary">por fin ordenados</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            Integración de estrategia, tecnología y automatización.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/brief">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 px-8 h-12 text-base">
                Agendar llamada
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <a href="#servicios">
              <Button variant="outline" size="lg" className="border-border text-muted-foreground hover:text-foreground hover:bg-secondary px-8 h-12 text-base">
                Ver servicios
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ── PAIN POINTS ── */}
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">El problema</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Muchos negocios digitales, poco orden real
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {painPoints.map((p, i) => (
            <motion.div
              key={p.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card/40 p-8 hover:border-destructive/30 transition-colors duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive mb-5">
                <p.icon size={22} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── VALUE PROP ── */}
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-3">Nuestra propuesta</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Construimos sistemas, no parches
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valuePillars.map((v, i) => (
            <motion.div
              key={v.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card/40 p-8 text-center hover:border-primary/30 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-5">
                <v.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── BENTO GRID (SERVICES) ── */}
    <div id="servicios">
      <BentoGrid />
    </div>

    {/* ── CONTACT ── */}
    <ContactForm />
  </PublicLayout>
);

export default Landing;
