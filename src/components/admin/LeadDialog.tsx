import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, Save, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LEAD_NICHES, getNicheLabel } from "@/lib/leadNiches";

// Mismas preguntas que en el registro manual, mantenidas en sincronía.
const FIT_QUESTIONS = [
  { id: "web_pro", label: "¿Tiene una web profesional?" },
  { id: "form_o_wa", label: "¿Tiene un formulario o solo WhatsApp?" },
  { id: "contenido_rrss", label: "¿Publica contenido en redes?" },
  { id: "tam_equipo", label: "¿Tiene entre 2 y 20 abogados aproximadamente?" },
  { id: "despacho_activo", label: "¿Parece un despacho activo (blog, reseñas, publicaciones recientes)?" },
] as const;

const FIT_OPTIONS = [
  { value: 2, label: "Sí", classes: "data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-300 data-[active=true]:border-emerald-500/40" },
  { value: 1, label: "Parcial", classes: "data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-300 data-[active=true]:border-amber-500/40" },
  { value: 0, label: "No", classes: "data-[active=true]:bg-rose-500/20 data-[active=true]:text-rose-300 data-[active=true]:border-rose-500/40" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "Nuevo" },
  { value: "waitlist", label: "Lista de espera" },
  { value: "oportunidad", label: "Oportunidad" },
  { value: "invitado", label: "Invitado" },
  { value: "cliente", label: "Cliente" },
  { value: "finalizado", label: "Finalizado" },
];

type FitValue = 0 | 1 | 2;
type FitAnswers = Record<string, FitValue | undefined>;

export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service_type: string | null;
  notes: string | null;
  status: string;
  fit_score?: number | null;
  fit_answers?: Record<string, number> | null;
  niche?: string | null;
}

interface LeadDialogProps {
  lead: LeadRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "view" | "edit";
}

const LeadDialog = ({ lead, open, onOpenChange, initialMode = "view" }: LeadDialogProps) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");
  const [niche, setNiche] = useState<string>("");
  const [answers, setAnswers] = useState<FitAnswers>({});

  // Cargar valores del lead cuando se abre o cambia.
  useEffect(() => {
    if (!lead) return;
    setMode(initialMode);
    setName(lead.name ?? "");
    setEmail(lead.email ?? "");
    setPhone(lead.phone ?? "");
    setCompany(lead.company ?? "");
    setServiceType(lead.service_type ?? "");
    setNotes(lead.notes ?? "");
    setStatus(lead.status ?? "new");
    setNiche(lead.niche ?? "");
    const fa = (lead.fit_answers ?? {}) as Record<string, number>;
    const parsed: FitAnswers = {};
    Object.keys(fa).forEach((k) => {
      const v = fa[k];
      if (v === 0 || v === 1 || v === 2) parsed[k] = v as FitValue;
    });
    setAnswers(parsed);
  }, [lead, initialMode, open]);

  const score = FIT_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] ?? 0), 0);
  const answeredCount = FIT_QUESTIONS.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = answeredCount === FIT_QUESTIONS.length;
  const isEdit = mode === "edit";

  const scoreColor =
    score >= 8 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    : score >= 5 ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
    : "bg-rose-500/20 text-rose-300 border-rose-500/40";

  const save = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      if (!name.trim() || !email.trim()) throw new Error("Nombre y email son obligatorios");

      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        company: company.trim() || null,
        service_type: serviceType.trim() || null,
        notes: notes.trim() || null,
        status,
        niche: niche || null,
        fit_score: allAnswered ? score : null,
        fit_answers: allAnswered ? answers : null,
      };

      const { error } = await supabase.from("leads").update(payload as never).eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Lead actualizado");
      setMode("view");
    },
    onError: (err: Error) => {
      const msg = /duplicate key|leads_email_unique/i.test(err.message)
        ? "Ya existe un lead con ese email"
        : err.message || "Error al guardar";
      toast.error(msg);
    },
  });

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil size={20} className="text-primary" /> : <Eye size={20} className="text-primary" />}
            {isEdit ? "Editar lead" : "Detalle del lead"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos y la calificación del lead." : "Consulta los datos y respuestas del Lead Fit Score."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre {isEdit && "*"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isEdit} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Email {isEdit && "*"}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEdit} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEdit} maxLength={40} />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa / Despacho</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} disabled={!isEdit} maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <Label>Servicio de interés</Label>
              <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} disabled={!isEdit} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              {isEdit ? (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={STATUS_OPTIONS.find((s) => s.value === status)?.label || status} disabled />
              )}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Nicho</Label>
              {isEdit ? (
                <Select value={niche || "__none"} onValueChange={(v) => setNiche(v === "__none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un nicho" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Sin especificar —</SelectItem>
                    {LEAD_NICHES.map((n) => (
                      <SelectItem key={n.value} value={n.value}>{n.emoji} {n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={getNicheLabel(niche)} disabled />
              )}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Notas internas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={!isEdit} rows={3} maxLength={1000} />
            </div>
          </div>

          {/* Lead Fit Score */}
          <div className="rounded-xl border border-border p-4 bg-card/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Lead Fit Score</h3>
                <p className="text-xs text-muted-foreground">Sí = 2 · Parcial = 1 · No = 0</p>
              </div>
              <Badge className={cn("text-sm font-bold border", allAnswered ? scoreColor : "bg-muted text-muted-foreground border-border")}>
                {allAnswered ? `${score} / 10` : "Sin calificar"}
              </Badge>
            </div>

            <div className="space-y-3">
              {FIT_QUESTIONS.map((q) => (
                <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-sm text-foreground/90">{q.label}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {FIT_OPTIONS.map((opt) => {
                      const active = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          data-active={active}
                          disabled={!isEdit}
                          onClick={() => isEdit && setAnswers((a) => ({ ...a, [q.id]: opt.value as FitValue }))}
                          className={cn(
                            "px-3 py-1 text-xs rounded-md border border-border bg-background/40 transition-colors",
                            isEdit && "hover:bg-muted cursor-pointer",
                            !isEdit && "opacity-80 cursor-default",
                            opt.classes,
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit ? (
            <>
              <Button variant="ghost" onClick={() => setMode("view")} disabled={save.isPending}>
                <X size={16} className="mr-1.5" /> Cancelar
              </Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim() || !email.trim()}>
                {save.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-1.5" />}
                Guardar cambios
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
              <Button onClick={() => setMode("edit")}>
                <Pencil size={16} className="mr-1.5" /> Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDialog;
