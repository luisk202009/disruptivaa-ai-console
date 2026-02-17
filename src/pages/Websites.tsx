import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";

const Websites = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Globe size={24} strokeWidth={1.5} className="text-[#00A3FF]" />
            <h1 className="text-2xl font-bold font-['Fira_Sans'] text-foreground tracking-wide">
              {t("navigation.websites")}
            </h1>
          </div>
          <div className="glass rounded-xl p-12 text-center">
            <Globe size={48} strokeWidth={1} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-zinc-500 text-sm">
              {t("dashboard.noWebsites")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Websites;
