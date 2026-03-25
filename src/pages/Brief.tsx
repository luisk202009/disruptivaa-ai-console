import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Rocket, ArrowLeft } from "lucide-react";
import PublicLayout from "@/components/landing/PublicLayout";
import { cn } from "@/lib/utils";

type BriefType = "web" | "mkt" | null;

const options = [
  {
    id: "web" as const,
    icon: Globe,
    title: "Ecosistema Digital",
    subtitle: "Websites, Landings, Apps",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    tallyId: "ID_TALLY_WEB",
  },
  {
    id: "mkt" as const,
    icon: Rocket,
    title: "Estrategia de Crecimiento",
    subtitle: "Marketing, Ads, Canales",
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    tallyId: "ID_TALLY_MKT",
  },
];

const Brief = () => {
  const [selected, setSelected] = useState<BriefType>(null);

  const selectedOption = options.find((o) => o.id === selected);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-28">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-14">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-3">Brief</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
                  ¿Qué necesitas?
                </h1>
                <p className="text-zinc-400">Seleccioná la categoría que mejor se ajuste a tu proyecto.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className={cn(
                      "group text-left rounded-2xl border border-white/[0.06] bg-card/40 p-10 transition-all duration-300",
                      "hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", opt.bgColor, opt.color)}>
                      <opt.icon size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{opt.title}</h3>
                    <p className="text-sm text-zinc-400">{opt.subtitle}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="iframe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 mb-8 transition-colors"
              >
                <ArrowLeft size={18} strokeWidth={1.5} />
                <span className="text-sm">Volver</span>
              </button>

              <div className="rounded-2xl border border-white/[0.06] bg-card/40 overflow-hidden">
                <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedOption?.bgColor, selectedOption?.color)}>
                    {selectedOption && <selectedOption.icon size={20} />}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedOption?.title}</h2>
                    <p className="text-xs text-zinc-500">{selectedOption?.subtitle}</p>
                  </div>
                </div>

                <div className="p-8 min-h-[500px] flex items-center justify-center">
                  <p className="text-zinc-500 text-sm text-center">
                    Formulario Tally.so ({selectedOption?.tallyId})
                    <br />
                    <span className="text-xs text-zinc-600 mt-2 block">
                      Reemplazá el ID del placeholder con tu formulario de Tally.so
                    </span>
                  </p>
                  {/* 
                    Uncomment and replace with your Tally IDs:
                    <iframe
                      src={`https://tally.so/embed/${selectedOption?.tallyId}?alignLeft=1&hideTitle=1&transparentBackground=1`}
                      className="w-full min-h-[500px] border-0"
                      title={selectedOption?.title}
                    />
                  */}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
};

export default Brief;
