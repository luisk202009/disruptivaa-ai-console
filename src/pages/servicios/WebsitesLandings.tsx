import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Layout, ArrowRight, Check, Paintbrush, Gauge, Search, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";

const benefits = [
  { icon: Paintbrush, title: "Diseño a medida", desc: "Cada página refleja tu marca. Sin templates genéricos: diseño único pensado para tu audiencia y objetivos." },
  { icon: MousePointerClick, title: "Optimización para conversión", desc: "Estructura, copy y CTAs diseñados para convertir visitantes en leads o clientes desde el primer clic." },
  { icon: Gauge, title: "Velocidad de carga", desc: "Sitios ultra-rápidos con Core Web Vitals optimizados. Mejor experiencia, mejor posicionamiento." },
  { icon: Search, title: "SEO desde el inicio", desc: "Arquitectura, metadatos y contenido preparados para posicionarte en Google desde el lanzamiento." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const WebsitesLandings = () => (
  <PublicLayout>
    {/* Hero */}
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Layout size={20} className="text-primary" />
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">Websites & Landing Pages</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            Websites que convierten <span className="text-primary">visitantes en clientes</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Diseñamos y desarrollamos sitios web y landing pages de alta conversión, optimizados para velocidad, SEO y resultados medibles.
          </p>
          <Link to="/brief?service=website">
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

    {/* Problemas que resolvemos */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-8">Problemas que resolvemos</h2>
        <ul className="space-y-4 text-left max-w-lg mx-auto">
          {[
            "Tu sitio actual no genera leads ni ventas",
            "Tiempo de carga lento que espanta visitantes",
            "Diseño desactualizado que no refleja tu marca",
            "Sin posicionamiento en Google ni estrategia SEO",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-muted-foreground">
              <Check size={18} className="text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <Link to="/brief">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              Empezar ahora <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default WebsitesLandings;
