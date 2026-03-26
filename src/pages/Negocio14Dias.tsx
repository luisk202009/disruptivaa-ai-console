import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PublicLayout from "@/components/landing/PublicLayout";

const plans = [
  {
    name: "Starter",
    price: "$1,400",
    description: "Lo esencial para empezar a vender online.",
    features: ["Landing page de alta conversión", "CRM configurado y listo", "WhatsApp Business integrado", "Dominio y hosting incluidos", "Capacitación inicial"],
  },
  {
    name: "Pro",
    price: "$2,000",
    description: "Automatización completa para escalar.",
    features: ["Todo lo del plan Starter", "Automatizaciones de seguimiento", "Pasarela de pagos integrada", "Flujos de email marketing", "Dashboard de métricas", "Soporte prioritario 30 días"],
    highlight: true,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Negocio14Dias = () => (
  <PublicLayout>
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-primary/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-32 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <Zap size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground tracking-wide">Quick Time-to-market</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.15] mb-6">
            Tu negocio digital completo en{" "}
            <span className="text-primary">14 días</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Web + CRM + Pagos + Automatizaciones. Todo configurado, conectado y listo para vender.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Pricing */}
    <section className="px-6 pb-24">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
          >
            <Card className={`h-full bg-card/60 backdrop-blur-sm ${plan.highlight ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border"}`}>
              <CardHeader className="pb-4">
                {plan.highlight && (
                  <span className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">Más popular</span>
                )}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-2">USD</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check size={16} className="text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/brief?service=14-dias" className="block">
                  <Button className={`w-full h-11 ${plan.highlight ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}>
                    Agendar llamada <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  </PublicLayout>
);

export default Negocio14Dias;
