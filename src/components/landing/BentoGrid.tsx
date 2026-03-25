import { motion } from "framer-motion";
import { BarChart3, MessageSquare, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: Lightbulb,
    title: "Consultoría Estratégica",
    description: "Diagnóstico integral de tu ecosistema digital. Diseñamos la hoja de ruta para maximizar tu crecimiento.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-400",
    link: "/brief",
  },
  {
    icon: MessageSquare,
    title: "Gestión de Canales",
    description: "Operación integral de Mercado Libre, WhatsApp Business y marketplaces. Automatización y escala.",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-400",
    link: "/soluciones/gestion-canales",
  },
  {
    icon: BarChart3,
    title: "Data Analytics",
    description: "Dashboards en tiempo real, BI avanzado y reportes ejecutivos que transforman datos en decisiones.",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-400",
    link: "/soluciones/data-analytics",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const BentoGrid = () => (
  <section className="py-24 px-6">
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-3">Servicios</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Todo lo que necesitas para escalar
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service, i) => (
          <motion.div
            key={service.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <Link to={service.link} className="group block h-full">
              <div className={`relative h-full rounded-2xl border border-white/[0.06] bg-gradient-to-br ${service.gradient} p-8 transition-all duration-300 hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1`}>
                <div className={`w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-6 ${service.iconColor}`}>
                  <service.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3 tracking-tight">{service.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{service.description}</p>
                <span className="inline-block mt-6 text-xs font-medium text-zinc-500 group-hover:text-white transition-colors">
                  Conocer más →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BentoGrid;
