import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import LandingConfig from "@/components/landing-builder/LandingConfig";
import LandingPreview from "@/components/landing-builder/LandingPreview";

interface LandingData {
  hero: { headline: string; subheadline: string; cta_text: string };
  benefits: { icon: string; title: string; description: string }[];
  social_proof: { quote: string; author: string; role: string }[];
  faq: { question: string; answer: string }[];
  final_cta: { headline: string; cta_text: string };
}

const LandingBuilder = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { companyName, companyColor } = useCompanyBranding();

  const [objective, setObjective] = useState("lead_generation");
  const [tone, setTone] = useState("professional");
  const [additionalContext, setAdditionalContext] = useState("");
  const [landingData, setLandingData] = useState<LandingData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-landing", {
        body: {
          companyName: companyName || "My Company",
          brandColor: companyColor,
          objective,
          tone,
          language: i18n.language?.slice(0, 2) || "es",
          additionalContext,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setLandingData(data.sections);
    } catch (err: any) {
      console.error("generate-landing error:", err);
      toast({ title: "Error", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <div className="h-full bg-zinc-950 border-r border-white/[0.06]">
              <LandingConfig
                objective={objective}
                tone={tone}
                additionalContext={additionalContext}
                isGenerating={isGenerating}
                onObjectiveChange={setObjective}
                onToneChange={setTone}
                onContextChange={setAdditionalContext}
                onGenerate={handleGenerate}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-white/[0.06]" />
          <ResizablePanel defaultSize={70}>
            <div className="h-full bg-black">
              <LandingPreview data={landingData} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default LandingBuilder;
