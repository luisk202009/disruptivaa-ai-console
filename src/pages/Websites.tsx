import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import ServiceCard from "@/components/ServiceCard";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { Skeleton } from "@/components/ui/skeleton";

const Websites = () => {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const { companyColor } = useCompanyBranding();

  const { data: websites, isLoading } = useQuery({
    queryKey: ["company_websites", profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from("company_websites")
        .select("*")
        .eq("company_id", profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

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

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : websites && websites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {websites.map((site) => (
                <ServiceCard
                  key={site.id}
                  url={site.url}
                  siteType={site.site_type}
                  companyColor={companyColor}
                />
              ))}
            </div>
          ) : (
            <div className="glass rounded-xl p-12 text-center">
              <Globe size={48} strokeWidth={1} className="mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-500 text-sm">
                {t("dashboard.noWebsites")}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Websites;
