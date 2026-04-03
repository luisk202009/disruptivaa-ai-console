import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, Plus, CreditCard, Link2, Copy, ChevronDown } from "lucide-react";

interface Subscription {
  id: string; company_id: string; plan_name: string; billing_cycle: string;
  price: number; currency: string | null; status: string; starts_at: string;
  expires_at: string | null; stripe_link: string | null; plan_id: string | null;
}

const SUBSCRIPTION_STATES = ["pending", "active", "expired", "canceled"] as const;
const SUBSCRIPTION_STATES = ["pending", "active", "expired", "canceled"] as const;

const statusBadgeClass: Record<string, string> = {
  active: "border-green-500/30 text-green-400",
  pending: "border-amber-500/30 text-amber-400",
  expired: "border-red-500/30 text-red-400",
  canceled: "border-zinc-500/30 text-zinc-400",
};

const AdminSubscriptions = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [subCompany, setSubCompany] = useState("");
  const [subPlan, setSubPlan] = useState("");
  const [subCycle, setSubCycle] = useState("");
  const [subPrice, setSubPrice] = useState("");
  const [subStartDate, setSubStartDate] = useState("");

  const { data: plans } = useQuery({
    queryKey: ["admin_plans_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("id, name").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });
  const [subPrice, setSubPrice] = useState("");
  const [subStartDate, setSubStartDate] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["admin_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Subscription[];
    },
  });

  const companyMap = new Map(companies?.map(c => [c.id, c.name]) ?? []);

  const createSubscription = useMutation({
    mutationFn: async () => {
      const selectedPlan = plans?.find(p => p.id === subPlan);
      const { error } = await supabase.from("subscriptions").insert({
        company_id: subCompany, plan_name: selectedPlan?.name || "", plan_id: subPlan, billing_cycle: subCycle || "monthly",
        price: parseFloat(subPrice), status: "pending", starts_at: subStartDate || new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      setSubCompany(""); setSubPlan(""); setSubCycle(""); setSubPrice(""); setSubStartDate("");
      toast.success(t("admin.subscriptionCreated"));
    },
    onError: () => toast.error(t("admin.websiteError")),
  });

  const updateSubStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("subscriptions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin_subscriptions"] }); toast.success(t("admin.statusUpdated")); },
    onError: () => toast.error(t("admin.websiteError")),
  });

  const generateStripeLink = useMutation({
    mutationFn: async (id: string) => {
      const link = `https://checkout.stripe.com/pay/${id.slice(0, 8)}_${Date.now()}`;
      const { error } = await supabase.from("subscriptions").update({ stripe_link: link }).eq("id", id);
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

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">Suscripciones</h1>
      <p className="text-sm text-muted-foreground mb-8">Gestiona los planes y suscripciones de las empresas.</p>

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
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
                    <TableCell className="text-foreground font-medium">{companyMap.get(sub.company_id) || sub.company_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-muted-foreground"><div className="flex items-center gap-1.5"><CreditCard size={14} className="text-muted-foreground" />{sub.plan_name}</div></TableCell>
                    <TableCell className="text-muted-foreground capitalize">{sub.billing_cycle}</TableCell>
                    <TableCell className="text-muted-foreground">{sub.currency || "USD"} {sub.price}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs capitalize ${statusBadgeClass[sub.status] || "border-white/10"}`}>{sub.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-white/10 text-xs h-7">{t("admin.status")} <ChevronDown size={12} className="ml-1" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {SUBSCRIPTION_STATES.map((s) => (
                              <DropdownMenuItem key={s} onClick={() => updateSubStatus.mutate({ id: sub.id, status: s })} className="capitalize">{s}</DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {sub.stripe_link ? (
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { navigator.clipboard.writeText(sub.stripe_link!); toast.success(t("admin.linkGenerated")); }}><Copy size={12} /></Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => generateStripeLink.mutate(sub.id)} disabled={generateStripeLink.isPending}><Link2 size={12} /></Button>
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
          <div className="flex items-center gap-2 mb-4"><Plus size={18} className="text-primary" /><h3 className="font-medium text-foreground">{t("admin.newSubscription")}</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <Select value={subCompany} onValueChange={setSubCompany}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder={t("admin.selectCompany")} /></SelectTrigger>
              <SelectContent>{companies?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={subPlan} onValueChange={setSubPlan}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
              <SelectContent>{plans?.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={subCycle} onValueChange={setSubCycle}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder={t("admin.billingCycle")} /></SelectTrigger>
              <SelectContent><SelectItem value="monthly">{t("admin.monthly")}</SelectItem><SelectItem value="annual">{t("admin.annual")}</SelectItem></SelectContent>
            </Select>
            <Input type="number" value={subPrice} onChange={(e) => setSubPrice(e.target.value)} placeholder={t("admin.price")} className="bg-white/[0.03] border-white/[0.08]" />
            <Input type="date" value={subStartDate} onChange={(e) => setSubStartDate(e.target.value)} className="bg-white/[0.03] border-white/[0.08]" />
          </div>
          <Button onClick={() => createSubscription.mutate()} disabled={!subCompany || !subPlan || !subPrice || createSubscription.isPending} className="w-full">
            {createSubscription.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <CreditCard size={14} className="mr-2" />}
            {t("admin.createSubscription")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
