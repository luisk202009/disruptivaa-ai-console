import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/landing/PublicLayout";
import BentoGrid from "@/components/landing/BentoGrid";
import ContactForm from "@/components/landing/ContactForm";

const Landing = () => (
  <PublicLayout>
    {/* ── HERO ── */}
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[hsl(213,100%,48%)]/[0.06] rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-36 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-8">
            <Zap size={14} className="text-[hsl(213,100%,60%)]" />
            <span className="text-xs text-zinc-400 tracking-wide">Consultora en Canales de Venta & Data Analytics</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.1] mb-6">
            El crecimiento digital no es suerte, es{" "}
            <span className="bg-gradient-to-r from-[hsl(213,100%,60%)] to-[hsl(260,100%,70%)] bg-clip-text text-transparent">
              ingeniería
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            Estrategia, gestión y datos para escalar tu negocio en canales digitales.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/brief">
              <Button size="lg" className="bg-[hsl(213,100%,48%)] hover:bg-[hsl(213,100%,42%)] text-white border-0 px-8 h-12 text-base">
                Empezar Diagnóstico
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="border-white/[0.1] text-zinc-300 hover:text-white hover:bg-white/[0.06] px-8 h-12 text-base">
                Ir a la App
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* ── BENTO GRID ── */}
    <BentoGrid />

    {/* ── CONTACT ── */}
    <ContactForm />
  </PublicLayout>
);

export default Landing;
