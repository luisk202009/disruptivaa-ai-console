import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, MessageCircle, TrendingUp, Settings2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";

const features = [
  { icon: ShoppingBag, title: "Mercado Libre", desc: "Gestión completa de publicaciones, pricing dinámico, stock y logística. Maximizamos tu posicionamiento." },
  { icon: MessageCircle, title: "WhatsApp Business", desc: "Automatización de respuestas, catálogos y flujos de venta. Convertimos conversaciones en clientes." },
  { icon: TrendingUp, title: "Escala & Crecimiento", desc: "Estrategias de crecimiento orgánico y paid. Optimización continua de métricas de rendimiento." },
  { icon: Settings2, title: "Operación Integral", desc: "Equipo dedicado a la operación diaria de tus canales, para que vos te enfoques en tu negocio." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const SolucionesCanales = () => (
  <PublicLayout>
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-emerald-500/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-32 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-semibold mb-4">Gestión de Canales</p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.15] mb-6">
            Operamos y escalamos tus canales de venta digital
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Mercado Libre, WhatsApp Business y más. Tu equipo externo de comercio digital con foco en resultados.
          </p>
        </motion.div>
      </div>
    </section>

    <section className="px-6 pb-24">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="rounded-2xl border border-border bg-card/40 p-8 hover:border-primary/30 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-5">
              <f.icon size={22} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-16">
        <Link to="/brief">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 px-8 h-12">
            Iniciar Brief <ArrowRight size={18} className="ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  </PublicLayout>
);

export default SolucionesCanales;
