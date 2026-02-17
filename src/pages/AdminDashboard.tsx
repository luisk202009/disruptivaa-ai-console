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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ExternalLink, Trash2, Plus, Globe, ShieldCheck, CreditCard } from "lucide-react";

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

interface AdminProfile {
  id: string;
  role: string | null;
  company_id: string | null;
  language: string | null;
  created_at: string | null;
}

const SITE_TYPES = ["Landing", "Website", "Ecommerce"] as const;

const MOCK_PLANS = [
  { name: "Starter", price: "$49/mo", stripe_id: "price_starter_mock" },
  { name: "Growth", price: "$149/mo", stripe_id: "price_growth_mock" },
  { name: "Enterprise", price: "$499/mo", stripe_id: "price_enterprise_mock" },
];

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

  // Fetch ALL profiles (requires admin RLS policy)
  const { data: allProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, company_id, language, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminProfile[];
    },
    enabled: isAdmin,
  });

  // Fetch all user_roles to know who is already admin
  const { data: allRoles } = useQuery({
    queryKey: ["admin_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const adminUserIds = new Set(
    allRoles?.filter(r => r.role === "admin").map(r => r.user_id) ?? []
  );

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

  // Promote to admin
  const promoteToAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" as const });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
      toast.success(t("admin.promoted"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  // Map company_id to company name
  const companyMap = new Map(companies?.map(c => [c.id, c.name]) ?? []);

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

          <Tabs defaultValue="companies" className="space-y-6">
            <TabsList className="bg-white/[0.03] border border-white/[0.06]">
              <TabsTrigger value="companies" className="data-[state=active]:bg-white/[0.08]">
                {t("admin.companies")}
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white/[0.08]">
                {t("admin.users")}
              </TabsTrigger>
              <TabsTrigger value="plans" className="data-[state=active]:bg-white/[0.08]">
                {t("admin.plans")}
              </TabsTrigger>
            </TabsList>

            {/* ===== COMPANIES TAB ===== */}
            <TabsContent value="companies">
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
            </TabsContent>

            {/* ===== USERS TAB ===== */}
            <TabsContent value="users">
              {profilesLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !allProfiles?.length ? (
                <p className="text-muted-foreground text-center py-16">No users found.</p>
              ) : (
                <div className="border border-white/[0.06] rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/[0.06] hover:bg-transparent">
                        <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                          ID
                        </TableHead>
                        <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                          {t("admin.role")}
                        </TableHead>
                        <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                          {t("admin.company")}
                        </TableHead>
                        <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">
                          {t("admin.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allProfiles.map((profile) => {
                        const isAlreadyAdmin = adminUserIds.has(profile.id);
                        return (
                          <TableRow key={profile.id} className="border-white/[0.06]">
                            <TableCell className="text-foreground font-mono text-xs">
                              {profile.id.slice(0, 8)}…
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs border-white/10">
                                {profile.role || "client"}
                              </Badge>
                              {isAlreadyAdmin && (
                                <Badge className="ml-2 bg-[#00A3FF]/20 text-[#00A3FF] text-xs">
                                  Admin
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {profile.company_id ? (companyMap.get(profile.company_id) || profile.company_id.slice(0, 8)) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {isAlreadyAdmin ? (
                                <span className="text-xs text-zinc-500">{t("admin.alreadyAdmin")}</span>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => promoteToAdmin.mutate(profile.id)}
                                  disabled={promoteToAdmin.isPending}
                                  className="border-[#00A3FF]/30 text-[#00A3FF] hover:bg-[#00A3FF]/10 hover:text-[#00A3FF]"
                                >
                                  <ShieldCheck size={14} className="mr-1.5" />
                                  {t("admin.promote")}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ===== PLANS TAB ===== */}
            <TabsContent value="plans">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                  {t("admin.mockBadge")}
                </Badge>
                <span className="text-xs text-zinc-500">Datos simulados — sin conexión a Stripe aún</span>
              </div>
              <div className="border border-white/[0.06] rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                        {t("admin.planName")}
                      </TableHead>
                      <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                        {t("admin.planPrice")}
                      </TableHead>
                      <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                        {t("admin.stripeId")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_PLANS.map((plan) => (
                      <TableRow key={plan.stripe_id} className="border-white/[0.06]">
                        <TableCell className="text-foreground font-medium flex items-center gap-2">
                          <CreditCard size={14} className="text-zinc-500" />
                          {plan.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{plan.price}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{plan.stripe_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Website Management Dialog */}
        <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
          <DialogContent className="sm:max-w-lg bg-background border-white/[0.08]">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {selectedCompany?.name} — {t("admin.sites")}
              </DialogTitle>
            </DialogHeader>

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
