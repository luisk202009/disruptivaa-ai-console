import { motion } from "framer-motion";
import { Users, Zap, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const services = [
  {
    icon: Users,
    title: "CRM que sí se usa",
    description: "Adopción real y procesos comerciales. Configuramos, capacitamos y acompañamos para que tu equipo lo use de verdad.",
    gradient: "from-primary/10 to-orange-500/5",
    iconColor: "text-primary",
    link: "/servicios/crm-hubspot",
    badge: null,
  },
  {
    icon: Zap,
    title: "Negocio Digital en 14 días",
    description: "Web + CRM + Pagos + Automatizaciones. Todo lo que necesitas para vender online, listo en tiempo récord.",
    gradient: "from-primary/10 to-amber-500/5",
    iconColor: "text-primary",
    link: "/servicios/negocio-14-dias",
    badge: "Quick Time-to-market",
  },
  {
    icon: ShoppingBag,
    title: "Shopify listo para vender",
    description: "E-commerce de alta conversión. Diseño, configuración, pasarelas de pago y estrategia de lanzamiento incluidos.",
    gradient: "from-emerald-500/10 to-teal-500/5",
    iconColor: "text-emerald-400",
    link: "/servicios/shopify",
    badge: null,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
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
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">Servicios</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Los 3 pilares para escalar tu negocio
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
              <div className={`relative h-full rounded-2xl border border-border bg-gradient-to-br ${service.gradient} p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1`}>
                {service.badge && (
                  <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border-primary/30 text-[10px] uppercase tracking-wider">
                    {service.badge}
                  </Badge>
                )}
                <div className={`w-12 h-12 rounded-xl bg-card flex items-center justify-center mb-6 ${service.iconColor}`}>
                  <service.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3 tracking-tight">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                <span className="inline-block mt-6 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
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
