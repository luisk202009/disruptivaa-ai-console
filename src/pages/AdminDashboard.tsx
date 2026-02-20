import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ExternalLink, Trash2, Plus, Globe, CreditCard, Link2, Copy, ChevronDown, Bell, Send, Mail, Eye } from "lucide-react";

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
  full_name: string | null;
  created_at: string | null;
}

interface Subscription {
  id: string;
  company_id: string;
  plan_name: string;
  billing_cycle: string;
  price: number;
  currency: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  stripe_link: string | null;
}

interface AdminNotification {
  id: string;
  company_id: string | null;
  title: string;
  message: string;
  type: string;
  read_by: string[];
  created_at: string | null;
}

const SITE_TYPES = ["Landing", "Website", "Ecommerce"] as const;
const PLAN_OPTIONS = ["Starter", "Growth", "Enterprise"] as const;
const SUBSCRIPTION_STATES = ["pending", "active", "expired", "canceled"] as const;
const NOTIFICATION_TYPES = ["info", "warning", "success", "error"] as const;

const statusBadgeClass: Record<string, string> = {
  active: "border-green-500/30 text-green-400",
  pending: "border-amber-500/30 text-amber-400",
  expired: "border-red-500/30 text-red-400",
  canceled: "border-zinc-500/30 text-zinc-400",
};

const notifTypeBadgeClass: Record<string, string> = {
  info: "border-blue-500/30 text-blue-400",
  warning: "border-amber-500/30 text-amber-400",
  success: "border-green-500/30 text-green-400",
  error: "border-red-500/30 text-red-400",
};

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const queryClient = useQueryClient();

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<string>("");

  // Subscription form state
  const [subCompany, setSubCompany] = useState("");
  const [subPlan, setSubPlan] = useState("");
  const [subCycle, setSubCycle] = useState("");
  const [subPrice, setSubPrice] = useState("");
  const [subStartDate, setSubStartDate] = useState("");

  // Notification form state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [notifCompany, setNotifCompany] = useState("all");

  // Email template state
  const [emailTemplate, setEmailTemplate] = useState("confirmation");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
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

  // Fetch ALL profiles
  const { data: allProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, company_id, language, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminProfile[];
    },
    enabled: isAdmin,
  });

  // Fetch all user_roles
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

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Subscription[];
    },
    enabled: isAdmin,
  });

  // Fetch notifications
  const { data: adminNotifications, isLoading: notifsLoading } = useQuery({
    queryKey: ["admin_notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminNotification[];
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
      toast.success(t("admin.promoted"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  // Revoke admin
  const revokeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] });
      toast.success(t("admin.revoked"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  // Create subscription
  const createSubscription = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("subscriptions").insert({
        company_id: subCompany,
        plan_name: subPlan,
        billing_cycle: subCycle || "monthly",
        price: parseFloat(subPrice),
        status: "pending",
        starts_at: subStartDate || new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      setSubCompany("");
      setSubPlan("");
      setSubCycle("");
      setSubPrice("");
      setSubStartDate("");
      toast.success(t("admin.subscriptionCreated"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  // Update subscription status
  const updateSubStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      toast.success(t("admin.statusUpdated"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  // Generate stripe link placeholder
  const generateStripeLink = useMutation({
    mutationFn: async (id: string) => {
      const link = `https://checkout.stripe.com/pay/${id.slice(0, 8)}_${Date.now()}`;
      const { error } = await supabase
        .from("subscriptions")
        .update({ stripe_link: link })
        .eq("id", id);
      if (error) throw error;
      return link;
    },
    onSuccess: (link) => {
      if (link) navigator.clipboard.writeText(link);
      queryClient.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      toast.success(t("admin.linkGenerated"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  const handleToggleAdmin = (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      revokeAdmin.mutate(userId);
    } else {
      promoteToAdmin.mutate(userId);
    }
  };

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
              <TabsTrigger value="subscriptions" className="data-[state=active]:bg-white/[0.08]">
                {t("admin.subscriptions")}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white/[0.08]">
                {t("admin.notifications")}
              </TabsTrigger>
              <TabsTrigger value="emails" className="data-[state=active]:bg-white/[0.08]">
                {t("admin.emails")}
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
                              className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
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
                          {t("admin.userName")}
                        </TableHead>
                        <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                          {t("admin.role")}
                        </TableHead>
                        <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">
                          {t("admin.company")}
                        </TableHead>
                        <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">
                          Admin
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allProfiles.map((profile) => {
                        const isAlreadyAdmin = adminUserIds.has(profile.id);
                        return (
                          <TableRow key={profile.id} className="border-white/[0.06]">
                            <TableCell className="text-foreground font-medium">
                              {profile.full_name || profile.id.slice(0, 8) + "…"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs border-white/10">
                                {profile.role || "client"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {profile.company_id ? (companyMap.get(profile.company_id) || profile.company_id.slice(0, 8)) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={isAlreadyAdmin}
                                onCheckedChange={() => handleToggleAdmin(profile.id, isAlreadyAdmin)}
                                disabled={promoteToAdmin.isPending || revokeAdmin.isPending}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ===== SUBSCRIPTIONS TAB ===== */}
            <TabsContent value="subscriptions">
              <div className="space-y-6">
                {/* Subscriptions table */}
                {subsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !subscriptions?.length ? (
                  <p className="text-muted-foreground text-center py-10">{t("admin.noSubscriptions")}</p>
                ) : (
                  <div className="border border-white/[0.06] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/[0.06] hover:bg-transparent">
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.company")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.plan")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.billingCycle")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.price")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.status")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">{t("admin.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((sub) => (
                          <TableRow key={sub.id} className="border-white/[0.06]">
                            <TableCell className="text-foreground font-medium">
                              {companyMap.get(sub.company_id) || sub.company_id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <CreditCard size={14} className="text-muted-foreground" />
                                {sub.plan_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground capitalize">{sub.billing_cycle}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {sub.currency || "USD"} {sub.price}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs capitalize ${statusBadgeClass[sub.status] || "border-white/10"}`}>
                                {sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-white/10 text-xs h-7">
                                      {t("admin.status")} <ChevronDown size={12} className="ml-1" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {SUBSCRIPTION_STATES.map((s) => (
                                      <DropdownMenuItem
                                        key={s}
                                        onClick={() => updateSubStatus.mutate({ id: sub.id, status: s })}
                                        className="capitalize"
                                      >
                                        {s}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                {sub.stripe_link ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(sub.stripe_link!);
                                      toast.success(t("admin.linkGenerated"));
                                    }}
                                  >
                                    <Copy size={12} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => generateStripeLink.mutate(sub.id)}
                                    disabled={generateStripeLink.isPending}
                                  >
                                    <Link2 size={12} />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* New Subscription Form */}
                <div className="p-5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus size={18} className="text-primary" />
                    <h3 className="font-medium text-foreground">{t("admin.newSubscription")}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    <Select value={subCompany} onValueChange={setSubCompany}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                        <SelectValue placeholder={t("admin.selectCompany")} />
                      </SelectTrigger>
                      <SelectContent>
                        {companies?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={subPlan} onValueChange={setSubPlan}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                        <SelectValue placeholder={t("admin.selectPlan")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={subCycle} onValueChange={setSubCycle}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                        <SelectValue placeholder={t("admin.billingCycle")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t("admin.monthly")}</SelectItem>
                        <SelectItem value="annual">{t("admin.annual")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      value={subPrice}
                      onChange={(e) => setSubPrice(e.target.value)}
                      placeholder={t("admin.price")}
                      className="bg-white/[0.03] border-white/[0.08]"
                    />

                    <Input
                      type="date"
                      value={subStartDate}
                      onChange={(e) => setSubStartDate(e.target.value)}
                      className="bg-white/[0.03] border-white/[0.08]"
                    />
                  </div>

                  <Button
                    onClick={() => createSubscription.mutate()}
                    disabled={!subCompany || !subPlan || !subPrice || createSubscription.isPending}
                    className="w-full"
                  >
                    {createSubscription.isPending ? (
                      <Loader2 size={14} className="animate-spin mr-2" />
                    ) : (
                      <CreditCard size={14} className="mr-2" />
                    )}
                    {t("admin.createSubscription")}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ===== NOTIFICATIONS TAB ===== */}
            <TabsContent value="notifications">
              <div className="space-y-6">
                {/* Send notification form */}
                <div className="p-5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Send size={18} className="text-primary" />
                    <h3 className="font-medium text-foreground">{t("notifications.sendNotification")}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Input
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder={t("notifications.notifTitle")}
                      className="bg-white/[0.03] border-white/[0.08]"
                    />
                    <Select value={notifType} onValueChange={setNotifType}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                        <SelectValue placeholder={t("notifications.notifType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_TYPES.map((nt) => (
                          <SelectItem key={nt} value={nt} className="capitalize">{nt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={notifBody}
                    onChange={(e) => setNotifBody(e.target.value)}
                    placeholder={t("notifications.notifBody")}
                    className="bg-white/[0.03] border-white/[0.08] mb-3"
                    rows={3}
                  />
                  <div className="flex gap-3 mb-4">
                    <Select value={notifCompany} onValueChange={setNotifCompany}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                        <SelectValue placeholder={t("notifications.destination")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("notifications.allCompanies")}</SelectItem>
                        {companies?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={async () => {
                      const { error } = await supabase.from("notifications").insert({
                        title: notifTitle,
                        message: notifBody,
                        type: notifType,
                        company_id: notifCompany === "all" ? null : notifCompany,
                      });
                      if (error) {
                        toast.error(t("admin.websiteError"));
                        return;
                      }
                      queryClient.invalidateQueries({ queryKey: ["admin_notifications"] });
                      queryClient.invalidateQueries({ queryKey: ["notifications"] });
                      setNotifTitle("");
                      setNotifBody("");
                      setNotifType("info");
                      setNotifCompany("all");
                      toast.success(t("notifications.sent"));
                    }}
                    disabled={!notifTitle || !notifBody}
                    className="w-full"
                  >
                    <Send size={14} className="mr-2" />
                    {t("notifications.sendNotification")}
                  </Button>
                </div>

                {/* Sent notifications table */}
                {notifsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !adminNotifications?.length ? (
                  <p className="text-muted-foreground text-center py-10">{t("notifications.noNotifications")}</p>
                ) : (
                  <div className="border border-white/[0.06] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/[0.06] hover:bg-transparent">
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("notifications.notifTitle")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("notifications.notifType")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("notifications.destination")}</TableHead>
                          <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">{t("admin.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminNotifications.map((notif) => (
                          <TableRow key={notif.id} className="border-white/[0.06]">
                            <TableCell className="text-foreground font-medium">{notif.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs capitalize ${notifTypeBadgeClass[notif.type] || "border-white/10"}`}>
                                {notif.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {notif.company_id ? (companyMap.get(notif.company_id) || notif.company_id.slice(0, 8)) : t("notifications.global")}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from("notifications").delete().eq("id", notif.id);
                                  if (!error) {
                                    queryClient.invalidateQueries({ queryKey: ["admin_notifications"] });
                                    queryClient.invalidateQueries({ queryKey: ["notifications"] });
                                  }
                                }}
                                className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ===== EMAILS TAB ===== */}
            <TabsContent value="emails">
              <div className="space-y-6">
                <div className="p-5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail size={18} className="text-primary" />
                    <h3 className="font-medium text-foreground">{t("admin.emailTemplate")}</h3>
                  </div>

                  <div className="space-y-4">
                    <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                      <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmation">{t("admin.emailConfirmation")}</SelectItem>
                        <SelectItem value="recovery">{t("admin.emailRecovery")}</SelectItem>
                        <SelectItem value="magiclink">{t("admin.emailMagicLink")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">{t("admin.emailSubject")}</label>
                      <Input
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder={emailTemplate === "confirmation" ? "Confirma tu cuenta" : emailTemplate === "magiclink" ? "Tu enlace de acceso" : "Recupera tu contraseña"}
                        className="bg-white/[0.03] border-white/[0.08]"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">{t("admin.emailBody")}</label>
                      <Textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="<h1>Hola {{ .Name }}</h1><p>...</p>"
                        className="bg-white/[0.03] border-white/[0.08] font-mono text-xs min-h-[200px]"
                        rows={10}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        disabled={!emailBody}
                        className="border-white/10"
                      >
                        <Eye size={14} className="mr-2" />
                        {t("admin.emailPreview")}
                      </Button>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(emailBody);
                          toast.success(t("admin.emailCopied"));
                        }}
                        disabled={!emailBody}
                      >
                        <Copy size={14} className="mr-2" />
                        {t("admin.emailSave")}
                      </Button>
                    </div>

                    {(emailTemplate === "confirmation" || emailTemplate === "magiclink") && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-400">
                          ⚠️ Esta plantilla requiere la variable <code className="bg-white/10 px-1 rounded">{"{{ .ConfirmationURL }}"}</code> para el enlace de acción.
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground border-t border-white/[0.06] pt-3">
                      💡 {t("admin.emailNote")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Preview Dialog */}
              <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-2xl bg-background border-white/[0.08] max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">{t("admin.emailPreview")}</DialogTitle>
                  </DialogHeader>
                  <div className="rounded-lg overflow-hidden border border-white/[0.06]">
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <style>
                            body { margin: 0; padding: 0; background: #000; font-family: 'Fira Sans', Arial, sans-serif; }
                          </style>
                        </head>
                        <body>
                          <div style="max-width:600px;margin:0 auto;background:#000;padding:40px 24px;">
                            <div style="text-align:center;margin-bottom:32px;">
                              <h2 style="color:#fff;font-size:18px;margin:0;">Disruptivaa</h2>
                            </div>
                            <div style="background:#111;border-radius:12px;padding:32px 24px;border:1px solid rgba(255,255,255,0.06);">
                              ${emailBody || '<p style="color:#888;text-align:center;">Sin contenido</p>'}
                            </div>
                            <p style="color:#555;font-size:11px;text-align:center;margin-top:24px;">
                              © ${new Date().getFullYear()} Disruptivaa. Todos los derechos reservados.
                            </p>
                          </div>
                        </body>
                        </html>
                      `}
                      className="w-full h-[400px] bg-black"
                      title="Email Preview"
                    />
                  </div>
                </DialogContent>
              </Dialog>
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
                        className="text-sm text-primary hover:underline truncate"
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
                className="mt-3 w-full"
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
