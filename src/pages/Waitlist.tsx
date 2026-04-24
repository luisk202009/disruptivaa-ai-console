import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import PublicLayout from "@/components/landing/PublicLayout";

const SERVICE_TYPES = [
  { value: "marketing-ads", label: "Marketing & Ads" },
  { value: "crm-hubspot", label: "CRM HubSpot" },
  { value: "mvp-aplicaciones", label: "MVP / Aplicaciones" },
  { value: "shopify", label: "Shopify / E-commerce" },
  { value: "websites-landings", label: "Websites & Landings" },
  { value: "otro", label: "Otro" },
];

const waitlistSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  company: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
  service_type: z.string().min(1, "Selecciona una opción"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

const Waitlist = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = waitlistSchema.safeParse({
      name,
      email,
      company,
      service_type: serviceType,
      notes,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Revisa los campos");
      return;
    }
    setLoading(true);
    try {
      // Crea/actualiza lead + brief con la info del waitlist
      const { error: rpcError } = await supabase.rpc("upsert_lead_and_brief", {
        _name: parsed.data.name,
        _email: parsed.data.email,
        _company: parsed.data.company,
        _service_type: parsed.data.service_type,
        _answers: {
          notes: parsed.data.notes ?? "",
          source: "waitlist",
        },
      });
      if (rpcError) throw rpcError;

      // Marca el lead como waitlist
      await supabase
        .from("leads")
        .update({ status: "waitlist" })
        .eq("email", parsed.data.email);

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo enviar tu solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <section className="container max-w-2xl mx-auto px-6 py-16 md:py-24">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 rounded-2xl border border-border bg-card/40 p-10"
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="text-primary" size={28} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                ¡Estás en la lista!
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Te enviaremos un email cuando se libere tu cupo. Los seleccionados
                obtienen <span className="text-foreground font-medium">1 año de
                servicio sin costo</span>.
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                Volver al inicio
              </Button>
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="text-center space-y-4 mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary">
                <Sparkles size={12} />
                Acceso anticipado · 1 año gratis
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Únete a la lista de espera
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
                Estamos abriendo cupos por invitación. Los seleccionados acceden
                a la plataforma y reciben hasta <span className="text-foreground font-medium">12 meses
                de servicio sin costo</span>.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-border bg-card/40 p-6 md:p-8"
            >
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="wl-name">Nombre</Label>
                  <Input
                    id="wl-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wl-email">Email</Label>
                  <Input
                    id="wl-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wl-company">Empresa</Label>
                <Input
                  id="wl-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de tu empresa"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wl-service">¿Qué necesitas?</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger id="wl-service">
                    <SelectValue placeholder="Selecciona un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wl-notes" className="flex items-center justify-between">
                  <span>Cuéntanos más (opcional)</span>
                  <span className="text-xs text-muted-foreground">
                    {notes.length}/500
                  </span>
                </Label>
                <Textarea
                  id="wl-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  placeholder="¿Qué problema quieres resolver con Disruptivaa?"
                  rows={4}
                  maxLength={500}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Solicitar acceso
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                ¿Ya tienes acceso?{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </form>
          </>
        )}
      </section>
    </PublicLayout>
  );
};

export default Waitlist;
