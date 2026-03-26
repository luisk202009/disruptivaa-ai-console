import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight, Check, CreditCard, Palette, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";

const benefits = [
  { icon: Palette, title: "Diseño de alta conversión", desc: "Tienda con UX optimizada para convertir visitantes en compradores desde el primer clic." },
  { icon: CreditCard, title: "Pasarelas de pago configuradas", desc: "Stripe, MercadoPago o la pasarela que necesites, lista para cobrar." },
  { icon: ShoppingBag, title: "Catálogo y logística", desc: "Productos, variantes, inventario y envíos configurados profesionalmente." },
  { icon: TrendingUp, title: "Estrategia de lanzamiento", desc: "Plan de go-to-market con campañas iniciales para generar tracción desde el día uno." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const ShopifyPage = () => (
  <PublicLayout>
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">Shopify</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            Tu tienda online, <span className="text-emerald-400">lista para vender</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Diseñamos, configuramos y lanzamos tu e-commerce en Shopify con todo lo necesario para que empieces a facturar.
          </p>
          <Link to="/brief?service=shopify">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              Solicitar propuesta <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>

    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">¿Qué incluye?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((b, i) => (
            <motion.div key={b.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="flex gap-5 p-6 rounded-2xl border border-border bg-card/40 hover:border-emerald-500/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
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

    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-8">¿Por qué Shopify?</h2>
        <ul className="space-y-4 text-left max-w-lg mx-auto">
          {["Plataforma líder mundial en e-commerce", "Escalable: desde 10 productos hasta 10,000+", "Ecosistema de apps y extensiones robusto", "Seguridad y uptime de nivel enterprise"].map((item) => (
            <li key={item} className="flex items-start gap-3 text-muted-foreground">
              <Check size={18} className="text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <Link to="/brief?service=shopify">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              Empezar ahora <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default ShopifyPage;
