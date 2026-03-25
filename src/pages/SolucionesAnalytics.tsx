import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, PieChart, Activity, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";

const features = [
  { icon: BarChart3, title: "Dashboards en Tiempo Real", desc: "Visualización unificada de todas tus métricas de marketing, ventas y operación en un solo lugar." },
  { icon: PieChart, title: "BI Avanzado", desc: "Análisis profundo con segmentación, cohortes y modelos predictivos para tomar decisiones basadas en datos." },
  { icon: Activity, title: "Reportes Ejecutivos", desc: "Reportes automatizados con los KPIs que importan. Ahorrá horas de análisis manual cada semana." },
  { icon: Database, title: "Integración de Datos", desc: "Conectamos Meta Ads, Google Ads, TikTok, Mercado Libre y más. Todos tus datos centralizados." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const SolucionesAnalytics = () => (
  <PublicLayout>
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-violet-500/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-32 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400 font-semibold mb-4">Data Analytics</p>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.15] mb-6">
            Transformamos datos en decisiones de crecimiento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Business Intelligence, dashboards y reportes ejecutivos para que cada decisión esté respaldada por datos.
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
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-5">
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

export default SolucionesAnalytics;
