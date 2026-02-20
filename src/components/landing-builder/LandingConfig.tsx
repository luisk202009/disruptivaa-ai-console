import { useTranslation } from "react-i18next";
import { Wand2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface LandingConfigProps {
  objective: string;
  tone: string;
  additionalContext: string;
  isGenerating: boolean;
  onObjectiveChange: (v: string) => void;
  onToneChange: (v: string) => void;
  onContextChange: (v: string) => void;
  onGenerate: () => void;
}

const LandingConfig = ({
  objective, tone, additionalContext, isGenerating,
  onObjectiveChange, onToneChange, onContextChange, onGenerate,
}: LandingConfigProps) => {
  const { t } = useTranslation();

  const objectives = [
    { value: "lead_generation", label: t("landingBuilder.leadGeneration") },
    { value: "sales", label: t("landingBuilder.sales") },
    { value: "branding", label: t("landingBuilder.branding") },
    { value: "event", label: t("landingBuilder.event") },
  ];

  const tones = [
    { value: "professional", label: t("landingBuilder.professional") },
    { value: "casual", label: t("landingBuilder.casual") },
    { value: "urgent", label: t("landingBuilder.urgent") },
    { value: "inspirational", label: t("landingBuilder.inspirational") },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground tracking-wide font-['Fira_Sans']">
          {t("landingBuilder.salesStructure")}
        </h2>
        <p className="text-xs text-zinc-500 mt-1">{t("landingBuilder.title")}</p>
      </div>

      <div className="space-y-5 flex-1">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-zinc-500">{t("landingBuilder.objective")}</Label>
          <Select value={objective} onValueChange={onObjectiveChange}>
            <SelectTrigger className="bg-zinc-900/60 border-white/[0.06] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {objectives.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-zinc-500">{t("landingBuilder.tone")}</Label>
          <Select value={tone} onValueChange={onToneChange}>
            <SelectTrigger className="bg-zinc-900/60 border-white/[0.06] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tones.map((to) => (
                <SelectItem key={to.value} value={to.value}>{to.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-zinc-500">{t("landingBuilder.additionalContext")}</Label>
          <Textarea
            value={additionalContext}
            onChange={(e) => onContextChange(e.target.value)}
            className="bg-zinc-900/60 border-white/[0.06] text-foreground min-h-[120px] resize-none"
            placeholder={t("landingBuilder.additionalContext")}
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        style={{ backgroundColor: "var(--primary-company, #00A3FF)" }}
      >
        {isGenerating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t("landingBuilder.generating")}
          </>
        ) : (
          <>
            <Wand2 size={18} />
            {t("landingBuilder.generateWithAI")}
          </>
        )}
      </button>
    </div>
  );
};

export default LandingConfig;
