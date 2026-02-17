import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ExternalLink, Trash2, Plus, Globe } from "lucide-react";

interface Company {
  id: string;
  name: string;
  branding_color: string | null;
  logo_url: string | null;
}

interface CompanyWebsite {
  id: string;
  company_id: string | null;
  url: string;
  site_type: string | null;
}

const SITE_TYPES = ["Landing", "Website", "Ecommerce"] as const;

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const queryClient = useQueryClient();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<string>("");

  // Fetch companies
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["admin_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, branding_color, logo_url")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
    enabled: isAdmin,
  });

  // Fetch websites for selected company
  const { data: websites, isLoading: websitesLoading } = useQuery({
    queryKey: ["admin_websites", selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data, error } = await supabase
        .from("company_websites")
        .select("*")
        .eq("company_id", selectedCompany.id)
        .order("created_at");
      if (error) throw error;
      return data as CompanyWebsite[];
    },
    enabled: !!selectedCompany,
  });

  // Add website
  const addWebsite = useMutation({
    mutationFn: async () => {
      if (!selectedCompany || !newUrl || !newType) return;
      const { error } = await supabase.from("company_websites").insert({
        company_id: selectedCompany.id,
        url: newUrl,
        site_type: newType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_websites", selectedCompany?.id] });
      setNewUrl("");
      setNewType("");
      toast.success(t("admin.websiteAdded"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  // Delete website
  const deleteWebsite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_websites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_websites", selectedCompany?.id] });
      toast.success(t("admin.websiteDeleted"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background font-['Fira_Sans',sans-serif]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">
            {t("admin.title")}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">{t("admin.subtitle")}</p>

          {companiesLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !companies?.length ? (
            <p className="text-muted-foreground text-center py-16">{t("admin.noCompanies")}</p>
          ) : (
            <div className="border border-white/[0.06] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                      {t("admin.companyName")}
                    </TableHead>
                    <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                      {t("admin.color")}
                    </TableHead>
                    <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">
                      {t("admin.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="border-white/[0.06]">
                      <TableCell className="text-foreground font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-white/10"
                            style={{ backgroundColor: company.branding_color || "#00A3FF" }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {company.branding_color || "#00A3FF"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCompany(company)}
                          className="border-[#00A3FF]/30 text-[#00A3FF] hover:bg-[#00A3FF]/10 hover:text-[#00A3FF]"
                        >
                          <Globe size={14} className="mr-1.5" />
                          {t("admin.manageSites")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Website Management Dialog */}
        <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
          <DialogContent className="sm:max-w-lg bg-background border-white/[0.08]">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {selectedCompany?.name} — {t("admin.sites")}
              </DialogTitle>
            </DialogHeader>

            {/* Current websites */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {websitesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : !websites?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("admin.noWebsites")}
                </p>
              ) : (
                websites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge variant="outline" className="text-[10px] shrink-0 border-white/10">
                        {site.site_type || "—"}
                      </Badge>
                      <a
                        href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#00A3FF] hover:underline truncate"
                      >
                        {site.url}
                      </a>
                      <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                    </div>
                    <button
                      onClick={() => deleteWebsite.mutate(site.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add website form */}
            <div className="border-t border-white/[0.06] pt-4 mt-2">
              <p className="text-xs text-muted-foreground mb-3">{t("admin.addWebsite")}</p>
              <div className="flex gap-2">
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 bg-white/[0.03] border-white/[0.08]"
                />
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="w-32 bg-white/[0.03] border-white/[0.08]">
                    <SelectValue placeholder={t("admin.type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SITE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => addWebsite.mutate()}
                disabled={!newUrl || !newType || addWebsite.isPending}
                className="mt-3 w-full bg-[#00A3FF] hover:bg-[#00A3FF]/90 text-white"
              >
                {addWebsite.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Plus size={14} className="mr-2" />
                )}
                {t("admin.addSite")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
