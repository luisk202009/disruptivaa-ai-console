import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Layout, Rocket, ShoppingBag, Users, Workflow, FileText, Lightbulb, Hammer, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";

import logoAcontapp from "@/assets/clients/acontapp.png";
import logoEdudestinos from "@/assets/clients/edudestinos.png";
import logoKuppel from "@/assets/clients/kuppel.png";
import logoAlbus from "@/assets/clients/albus.png";
import logoAsuclean from "@/assets/clients/asuclean.png";
import logoAlatra from "@/assets/clients/alatra.png";
import logoClient8 from "@/assets/clients/img-5631.png";
import logoImagotipo from "@/assets/clients/imagotipo-2022.png";
import logoPolaPerola from "@/assets/clients/pola-perola.png";
import logoSuma from "@/assets/clients/suma.png";
import logoHypeGoods from "@/assets/clients/hypegoods.png";

const clients = [
  { name: "Acontapp", logo: logoAcontapp },
  { name: "Edudestinos", logo: logoEdudestinos },
  { name: "Kuppel", logo: logoKuppel },
  { name: "Albus", logo: logoAlbus },
  { name: "Asuclean", logo: logoAsuclean },
  { name: "Alatra", logo: logoAlatra },
  { name: "Cliente", logo: logoClient8 },
  { name: "Imagotipo", logo: logoImagotipo },
  { name: "Pola Perola", logo: logoPolaPerola },
  { name: "SUMA", logo: logoSuma },
  { name: "Hype Goods", logo: logoHypeGoods },
];

const services = [
  { icon: Workflow, title: "CRM HubSpot", desc: "Consultoría, implementación y acompañamiento." },
  { icon: ShoppingBag, title: "Shopify", desc: "E-commerce listo para vender." },
  { icon: BarChart3, title: "Marketing & Ads", desc: "Campañas que generan retorno real." },
  { icon: Layout, title: "Websites & Landings", desc: "Sitios que convierten visitantes en clientes." },
  { icon: Rocket, title: "MVP & Aplicaciones", desc: "Tu idea hecha producto digital." },
  { icon: Users, title: "Negocio en 14 días", desc: "Todo lo que necesitas para lanzar rápido." },
];

const process = [
  { step: "01", icon: FileText, title: "Brief", desc: "Escuchamos tu necesidad y definimos alcance." },
  { step: "02", icon: Lightbulb, title: "Estrategia", desc: "Diseñamos el plan de acción ideal." },
  { step: "03", icon: Hammer, title: "Ejecución", desc: "Construimos, configuramos y lanzamos." },
  { step: "04", icon: HeadphonesIcon, title: "Acompañamiento", desc: "Te acompañamos post-lanzamiento." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const Nosotros = () => (
  <PublicLayout>
    {/* Hero */}
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">Nosotros</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
            Ayudamos a empresas a crecer con <span className="text-primary">tecnología y estrategia digital</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Somos un equipo de consultores, desarrolladores y estrategas digitales. Combinamos tecnología, datos y ejecución para que tu negocio escale con procesos claros y herramientas que funcionan.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Qué hacemos */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Qué hacemos</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Seis líneas de servicio para cubrir cada etapa del crecimiento digital de tu empresa.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div key={s.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="p-6 rounded-2xl border border-border bg-card/40 hover:border-primary/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <s.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Proceso */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Cómo trabajamos</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {process.map((p, i) => (
            <motion.div key={p.step} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              className="relative text-center p-6 rounded-2xl border border-border bg-card/40">
              <span className="text-5xl font-black text-primary/10 absolute top-3 right-4">{p.step}</span>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                <p.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Clientes */}
    <section className="py-20 px-6 border-t border-border bg-card/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Clientes que confían en nosotros</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-14">
          {clients.map((c, i) => (
            <motion.div key={c.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <img src={c.logo} alt={c.name} className="h-10 md:h-12 object-contain opacity-70 hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-foreground tracking-tight mb-4">¿Listo para empezar?</h2>
        <p className="text-muted-foreground mb-8">Cuéntanos sobre tu proyecto y te proponemos una solución.</p>
        <Link to="/brief">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            Enviar brief <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    </section>
  </PublicLayout>
);

export default Nosotros;
