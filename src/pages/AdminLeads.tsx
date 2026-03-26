import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, FileText, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";
import BriefDetailDialog from "@/components/admin/BriefDetailDialog";

const statusOptions = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Nuevo" },
  { value: "oportunidad", label: "Oportunidad" },
  { value: "cliente", label: "Cliente" },
  { value: "finalizado", label: "Finalizado" },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  oportunidad: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  cliente: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  finalizado: "bg-muted text-muted-foreground border-border",
};

interface BriefSubmission {
  id: string;
  lead_id: string;
  service_type: string;
  answers: Record<string, string>;
}

const AdminLeads = () => {
  const [filter, setFilter] = useState("all");
  const [briefDialog, setBriefDialog] = useState<{ open: boolean; serviceType: string | null; answers: Record<string, string> | null; leadName: string }>({
    open: false, serviceType: null, answers: null, leadName: "",
  });
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads", filter],
    queryFn: async () => {
      let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: briefs } = useQuery({
    queryKey: ["admin-briefs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brief_submissions").select("*");
      if (error) throw error;
      return data as unknown as BriefSubmission[];
    },
  });

  const briefsByLead = new Map<string, BriefSubmission>();
  briefs?.forEach((b) => { if (b.lead_id) briefsByLead.set(b.lead_id, b); });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al actualizar estado"),
  });

  const inviteLead = useMutation({
    mutationFn: async (leadId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("invite-lead-user", {
        body: { lead_id: leadId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Invitación enviada correctamente");
    },
    onError: (err: any) => toast.error(err?.message || "Error al enviar invitación"),
  });

  const openBrief = (leadId: string, leadName: string, serviceType: string | null) => {
    const brief = briefsByLead.get(leadId);
    setBriefDialog({
      open: true,
      serviceType: brief?.service_type || serviceType,
      answers: brief?.answers as Record<string, string> || null,
      leadName,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Leads CRM</h1>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !leads?.length ? (
            <p className="text-center text-muted-foreground py-20">No hay leads{filter !== "all" ? ` con estado "${filter}"` : ""}.</p>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const hasBrief = briefsByLead.has(lead.id);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.company || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{lead.service_type || "—"}</Badge></TableCell>
                        <TableCell>
                          <Badge className={statusColors[lead.status] || statusColors.new}>{lead.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {lead.created_at ? format(new Date(lead.created_at), "dd MMM yyyy", { locale: es }) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select value={lead.status} onValueChange={(v) => updateStatus.mutate({ id: lead.id, status: v })}>
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.filter((s) => s.value !== "all").map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {hasBrief && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver brief"
                                onClick={() => openBrief(lead.id, lead.name, lead.service_type)}>
                                <FileText size={16} />
                              </Button>
                            )}
                            {lead.status !== "cliente" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Invitar a plataforma"
                                onClick={() => inviteLead.mutate(lead.id)}
                                disabled={inviteLead.isPending}>
                                {inviteLead.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <BriefDetailDialog
        open={briefDialog.open}
        onOpenChange={(open) => setBriefDialog((p) => ({ ...p, open }))}
        serviceType={briefDialog.serviceType}
        answers={briefDialog.answers}
        leadName={briefDialog.leadName}
      />
    </div>
  );
};

export default AdminLeads;
