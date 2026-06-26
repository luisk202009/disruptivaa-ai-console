import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_NICHES } from "@/lib/leadNiches";

// Preguntas del Lead Fit Score (máx 10 pts; Sí=2, Parcial=1, No=0)
const FIT_QUESTIONS = [
  { id: "web_pro", label: "¿Tiene una web profesional?" },
  { id: "form_o_wa", label: "¿Tiene un formulario o solo WhatsApp?" },
  { id: "contenido_rrss", label: "¿Publica contenido en redes?" },
  { id: "tam_equipo", label: "¿Tiene entre 2 y 20 abogados aproximadamente?" },
  { id: "despacho_activo", label: "¿Parece un despacho activo (blog, reseñas, publicaciones recientes)?" },
] as const;

type FitValue = 0 | 1 | 2;
type FitAnswers = Record<string, FitValue | undefined>;

const FIT_OPTIONS: { value: FitValue; label: string; classes: string }[] = [
  { value: 2, label: "Sí", classes: "data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-300 data-[active=true]:border-emerald-500/40" },
  { value: 1, label: "Parcial", classes: "data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-300 data-[active=true]:border-amber-500/40" },
  { value: 0, label: "No", classes: "data-[active=true]:bg-rose-500/20 data-[active=true]:text-rose-300 data-[active=true]:border-rose-500/40" },
];

interface ManualLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ManualLeadDialog = ({ open, onOpenChange }: ManualLeadDialogProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [niche, setNiche] = useState<string>("");
  const [answers, setAnswers] = useState<FitAnswers>({});

  const score = FIT_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] ?? 0), 0);
  const answeredCount = FIT_QUESTIONS.filter((q) => answers[q.id] !== undefined).length;
  const allAnswered = answeredCount === FIT_QUESTIONS.length;

  const scoreColor =
    score >= 8 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    : score >= 5 ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
    : "bg-rose-500/20 text-rose-300 border-rose-500/40";

  const reset = () => {
    setName(""); setEmail(""); setPhone(""); setCompany("");
    setServiceType(""); setNotes(""); setNiche(""); setAnswers({});
  };

  const createLead = useMutation({
    mutationFn: async () => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!name.trim() || !trimmedEmail) throw new Error("Nombre y email son obligatorios");

      // Si está calificado: oportunidad si score>=8, waitlist si 5-7, new si <5
      const status = allAnswered
        ? (score >= 8 ? "oportunidad" : score >= 5 ? "waitlist" : "new")
        : "new";

      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: trimmedEmail,
        company: company.trim() || null,
        phone: phone.trim() || null,
        service_type: serviceType.trim() || null,
        notes: notes.trim() || null,
        niche: niche || null,
        status,
        source: "manual",
      };

      if (allAnswered) {
        payload.fit_score = score;
        payload.fit_answers = answers;
      }

      const { error } = await supabase.from("leads").insert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Lead registrado correctamente");
      reset();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      const msg = /duplicate key|leads_email_unique/i.test(err.message)
        ? "Ya existe un lead con ese email"
        : err.message || "Error al registrar lead";
      toast.error(msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-primary" />
            Nuevo lead manual
          </DialogTitle>
          <DialogDescription>
            Registra un lead y opcionalmente califícalo con el Lead Fit Score (máx. 10 puntos).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ml-name">Nombre *</Label>
              <Input id="ml-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ml-email">Email *</Label>
              <Input id="ml-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ml-phone">Teléfono</Label>
              <Input id="ml-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ml-company">Empresa / Despacho</Label>
              <Input id="ml-company" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ml-service">Servicio de interés</Label>
              <Input id="ml-service" value={serviceType} onChange={(e) => setServiceType(e.target.value)}
                placeholder="Ej. marketing-abogados, crm-hubspot…" maxLength={80} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="ml-notes">Notas internas</Label>
              <Textarea id="ml-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} />
            </div>
          </div>

          {/* Lead Fit Score */}
          <div className="rounded-xl border border-border p-4 bg-card/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Lead Fit Score</h3>
                <p className="text-xs text-muted-foreground">
                  ¿Merece la pena contactar? Sí = 2 · Parcial = 1 · No = 0
                </p>
              </div>
              <Badge className={cn("text-sm font-bold border", scoreColor)}>
                {score} / 10
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
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                          className={cn(
                            "px-3 py-1 text-xs rounded-md border border-border bg-background/40 transition-colors hover:bg-muted",
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

            {!allAnswered && (
              <p className="text-xs text-muted-foreground">
                Responde las 5 preguntas para asignar puntuación. Puedes guardar el lead sin calificar.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createLead.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => createLead.mutate()} disabled={createLead.isPending || !name.trim() || !email.trim()}>
            {createLead.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
            Guardar lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualLeadDialog;
