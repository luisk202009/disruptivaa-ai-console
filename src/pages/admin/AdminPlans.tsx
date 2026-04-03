import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Crown, Pencil, Plus, X, Infinity } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  max_projects: number;
  max_goals_per_project: number;
  max_ai_agents: number;
  max_dashboards: number;
  max_integrations: number;
  is_active: boolean;
  price: number;
  currency: string;
  stripe_price_id: string | null;
}

const EMPTY_FORM = {
  name: "", max_projects: "-1", max_goals_per_project: "-1",
  max_ai_agents: "-1", max_dashboards: "-1", max_integrations: "-1",
  is_active: true, price: "0", currency: "USD", stripe_price_id: "",
};

const CURRENCIES = ["USD", "MXN", "EUR", "COP", "ARS", "CLP"];

const LimitCell = ({ value }: { value: number }) => (
  <span className="text-muted-foreground">
    {value === -1 ? <Infinity size={14} className="inline text-emerald-500" /> : value}
  </span>
);

const AdminPlans = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("created_at");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const savePlan = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        max_projects: parseInt(form.max_projects),
        max_goals_per_project: parseInt(form.max_goals_per_project),
        max_ai_agents: parseInt(form.max_ai_agents),
        max_dashboards: parseInt(form.max_dashboards),
        max_integrations: parseInt(form.max_integrations),
        is_active: form.is_active,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        stripe_price_id: form.stripe_price_id || null,
      };
      if (editingId) {
        const { error } = await supabase.from("plans").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plans").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin_plans_active"] });
      resetForm();
      toast.success(editingId ? "Plan actualizado" : "Plan creado");
    },
    onError: () => toast.error("Error al guardar el plan"),
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (plan: Plan) => {
    setForm({
      name: plan.name,
      max_projects: String(plan.max_projects),
      max_goals_per_project: String(plan.max_goals_per_project),
      max_ai_agents: String(plan.max_ai_agents),
      max_dashboards: String(plan.max_dashboards),
      max_integrations: String(plan.max_integrations),
      is_active: plan.is_active,
      price: String(plan.price),
      currency: plan.currency || "USD",
      stripe_price_id: plan.stripe_price_id || "",
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">Planes</h1>
          <p className="text-sm text-muted-foreground">Define los límites y precios para cada nivel de suscripción.</p>
        </div>
        {!showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} variant="outline" size="sm" className="border-white/10">
            <Plus size={14} className="mr-1.5" /> Nuevo plan
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-5 rounded-lg border border-white/[0.06] bg-white/[0.02] mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              <h3 className="font-medium text-foreground">{editingId ? "Editar plan" : "Nuevo plan"}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 w-7 p-0"><X size={14} /></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Starter" className="bg-white/[0.03] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Precio</label>
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} placeholder="99.00" className="bg-white/[0.03] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Moneda</label>
              <Select value={form.currency} onValueChange={(v) => setForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Stripe Price ID</label>
              <Input value={form.stripe_price_id} onChange={(e) => setForm(f => ({ ...f, stripe_price_id: e.target.value }))} placeholder="price_xxx" className="bg-white/[0.03] border-white/[0.08] font-mono text-xs" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Máx. proyectos (-1 = ilimitado)</label>
              <Input type="number" value={form.max_projects} onChange={(e) => setForm(f => ({ ...f, max_projects: e.target.value }))} className="bg-white/[0.03] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Máx. metas / proyecto</label>
              <Input type="number" value={form.max_goals_per_project} onChange={(e) => setForm(f => ({ ...f, max_goals_per_project: e.target.value }))} className="bg-white/[0.03] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Máx. agentes IA</label>
              <Input type="number" value={form.max_ai_agents} onChange={(e) => setForm(f => ({ ...f, max_ai_agents: e.target.value }))} className="bg-white/[0.03] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Máx. paneles</label>
              <Input type="number" value={form.max_dashboards} onChange={(e) => setForm(f => ({ ...f, max_dashboards: e.target.value }))} className="bg-white/[0.03] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Máx. integraciones</label>
              <Input type="number" value={form.max_integrations} onChange={(e) => setForm(f => ({ ...f, max_integrations: e.target.value }))} className="bg-white/[0.03] border-white/[0.08]" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <span className="text-sm text-muted-foreground">Activo</span>
            </div>
            <Button onClick={() => savePlan.mutate()} disabled={!form.name || savePlan.isPending}>
              {savePlan.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
              {editingId ? "Guardar cambios" : "Crear plan"}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !plans?.length ? (
        <p className="text-muted-foreground text-center py-10">No hay planes creados.</p>
      ) : (
        <div className="border border-white/[0.06] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">Precio</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-center">Proyectos</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-center">Metas</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-center">Agentes IA</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-center">Paneles</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-center">Integraciones</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-center">Estado</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className="border-white/[0.06]">
                  <TableCell className="text-foreground font-medium">{plan.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatPrice(plan.price, plan.currency || "USD")}</TableCell>
                  <TableCell className="text-center"><LimitCell value={plan.max_projects} /></TableCell>
                  <TableCell className="text-center"><LimitCell value={plan.max_goals_per_project} /></TableCell>
                  <TableCell className="text-center"><LimitCell value={plan.max_ai_agents} /></TableCell>
                  <TableCell className="text-center"><LimitCell value={plan.max_dashboards} /></TableCell>
                  <TableCell className="text-center"><LimitCell value={plan.max_integrations} /></TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${plan.is_active ? "border-green-500/30 text-green-400" : "border-zinc-500/30 text-zinc-400"}`}>
                      {plan.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => startEdit(plan)}>
                      <Pencil size={12} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
