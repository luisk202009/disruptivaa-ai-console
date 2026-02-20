import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Copy, Wand2, Zap, Shield, TrendingUp, Target, Clock, Star, Heart, CheckCircle, Quote } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

interface LandingData {
  hero: { headline: string; subheadline: string; cta_text: string };
  benefits: { icon: string; title: string; description: string }[];
  social_proof: { quote: string; author: string; role: string }[];
  faq: { question: string; answer: string }[];
  final_cta: { headline: string; cta_text: string };
}

interface LandingPreviewProps {
  data: LandingData | null;
}

const iconMap: Record<string, React.ReactNode> = {
  zap: <Zap size={24} />,
  shield: <Shield size={24} />,
  "trending-up": <TrendingUp size={24} />,
  target: <Target size={24} />,
  clock: <Clock size={24} />,
  star: <Star size={24} />,
  heart: <Heart size={24} />,
  "check-circle": <CheckCircle size={24} />,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const LandingPreview = ({ data }: LandingPreviewProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const toMarkdown = () => {
    if (!data) return "";
    let md = `# ${data.hero.headline}\n\n${data.hero.subheadline}\n\n**[${data.hero.cta_text}]**\n\n---\n\n`;
    md += `## ${t("landingBuilder.benefits")}\n\n`;
    data.benefits.forEach((b) => { md += `### ${b.title}\n${b.description}\n\n`; });
    md += `---\n\n## ${t("landingBuilder.socialProof")}\n\n`;
    data.social_proof.forEach((s) => { md += `> "${s.quote}"\n> — **${s.author}**, ${s.role}\n\n`; });
    md += `---\n\n## ${t("landingBuilder.faq")}\n\n`;
    data.faq.forEach((f) => { md += `**${f.question}**\n${f.answer}\n\n`; });
    md += `---\n\n## ${data.final_cta.headline}\n\n**[${data.final_cta.cta_text}]**\n`;
    return md;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(toMarkdown());
    toast({ title: t("landingBuilder.copied") });
  };

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <Wand2 size={64} className="text-zinc-700 mb-6" />
        <p className="text-zinc-500 text-sm max-w-sm">{t("landingBuilder.emptyState")}</p>
      </div>
    );
  }

  const companyColor = "var(--primary-company, #00A3FF)";

  return (
    <div className="h-full overflow-y-auto scrollbar-minimal relative">
      {/* Copy FAB */}
      <button
        onClick={handleCopy}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-800/90 backdrop-blur border border-white/[0.08] text-zinc-200 text-sm font-medium hover:bg-zinc-700/90 transition-colors shadow-lg"
      >
        <Copy size={16} />
        {t("landingBuilder.copyCopy")}
      </button>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-16">
        {/* HERO */}
        <motion.section
          initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="text-center py-16 px-8 rounded-2xl border border-white/[0.08] relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.95)), linear-gradient(135deg, ${companyColor}22, transparent)` }}
        >
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 20%, ${companyColor}, transparent 60%)` }} />
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.3em] mb-4 font-bold" style={{ color: companyColor }}>{t("landingBuilder.hero")}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">{data.hero.headline}</h1>
            <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">{data.hero.subheadline}</p>
            <span className="inline-block px-8 py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: companyColor }}>
              {data.hero.cta_text}
            </span>
          </div>
        </motion.section>

        {/* BENEFITS */}
        <motion.section initial="hidden" animate="visible" custom={1} variants={fadeUp}>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold text-center" style={{ color: companyColor }}>{t("landingBuilder.benefits")}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.benefits.map((b, i) => (
              <motion.div
                key={i} custom={i + 2} initial="hidden" animate="visible" variants={fadeUp}
                className="p-6 rounded-xl border border-white/[0.06] bg-zinc-900/40"
              >
                <div className="mb-3" style={{ color: companyColor }}>{iconMap[b.icon] || <Zap size={24} />}</div>
                <h3 className="text-foreground font-semibold mb-2">{b.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* SOCIAL PROOF */}
        <motion.section initial="hidden" animate="visible" custom={3} variants={fadeUp}>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold text-center" style={{ color: companyColor }}>{t("landingBuilder.socialProof")}</p>
          <div className="space-y-4">
            {data.social_proof.map((s, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/[0.06] bg-zinc-900/40 relative">
                <Quote size={20} className="text-zinc-700 absolute top-4 left-4" />
                <p className="text-zinc-300 italic pl-8 mb-3">"{s.quote}"</p>
                <p className="text-xs text-zinc-500 pl-8">— <span className="text-zinc-300 font-medium">{s.author}</span>, {s.role}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section initial="hidden" animate="visible" custom={4} variants={fadeUp}>
          <p className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold text-center" style={{ color: companyColor }}>{t("landingBuilder.faq")}</p>
          <Accordion type="single" collapsible className="space-y-2">
            {data.faq.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-white/[0.06] rounded-xl bg-zinc-900/40 px-4">
                <AccordionTrigger className="text-foreground text-sm font-medium hover:no-underline">{f.question}</AccordionTrigger>
                <AccordionContent className="text-zinc-400 text-sm">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>

        {/* FINAL CTA */}
        <motion.section
          initial="hidden" animate="visible" custom={5} variants={fadeUp}
          className="text-center py-12 px-8 rounded-2xl border border-white/[0.08]"
          style={{ background: `linear-gradient(135deg, ${companyColor}11, transparent)` }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] mb-4 font-bold" style={{ color: companyColor }}>{t("landingBuilder.finalCta")}</p>
          <h2 className="text-2xl font-bold text-foreground mb-6">{data.final_cta.headline}</h2>
          <span className="inline-block px-8 py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: companyColor }}>
            {data.final_cta.cta_text}
          </span>
        </motion.section>

        <div className="h-20" />
      </div>
    </div>
  );
};

export default LandingPreview;
