import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface Question {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
}

export const questionsByService: Record<string, Question[]> = {
  "crm-hubspot": [
    { id: "team_size", label: "¿Cuántos vendedores tiene tu equipo?", type: "select", options: ["1-3", "4-10", "11-25", "25+"] },
    { id: "current_crm", label: "¿Usas algún CRM actualmente?", type: "select", options: ["No, es la primera vez", "Sí, pero no lo usamos", "Sí, pero quiero migrar", "Uso Excel/Sheets"] },
    { id: "processes", label: "¿Qué procesos quieres automatizar?", type: "textarea", placeholder: "Ej: seguimiento de leads, cotizaciones, onboarding de clientes..." },
  ],
  "shopify": [
    { id: "product_count", label: "¿Cuántos productos vas a vender?", type: "select", options: ["1-20", "21-100", "101-500", "500+"] },
    { id: "selling_online", label: "¿Vendes actualmente online?", type: "select", options: ["No, es mi primera tienda", "Sí, en otra plataforma", "Sí, por redes sociales"] },
    { id: "payment_gateway", label: "¿Qué pasarela de pagos necesitas?", type: "select", options: ["Stripe", "MercadoPago", "PayPal", "Otra", "No sé"] },
    { id: "details", label: "Cuéntanos más sobre tu negocio", type: "textarea", placeholder: "Ej: tipo de productos, mercado objetivo, fecha ideal de lanzamiento..." },
  ],
  "14-dias": [
    { id: "has_domain", label: "¿Ya tienes dominio web?", type: "select", options: ["Sí", "No", "No sé qué es"] },
    { id: "what_you_sell", label: "¿Qué vendes o vas a vender?", type: "text", placeholder: "Ej: consultoría, productos físicos, cursos..." },
    { id: "budget", label: "¿Cuál es tu presupuesto aproximado?", type: "select", options: ["Menos de $1,000", "$1,000 - $2,000", "$2,000 - $5,000", "Más de $5,000"] },
    { id: "urgency", label: "¿Cuándo necesitas tenerlo listo?", type: "select", options: ["Lo antes posible", "En 2-4 semanas", "En 1-2 meses", "Sin prisa"] },
  ],
  "marketing-ads": [
    { id: "platforms", label: "¿En qué plataformas anuncias actualmente?", type: "select", options: ["Ninguna", "Meta (Facebook/Instagram)", "Google Ads", "TikTok Ads", "Varias"] },
    { id: "monthly_budget", label: "¿Presupuesto mensual de ads?", type: "select", options: ["Menos de $500", "$500 - $2,000", "$2,000 - $5,000", "$5,000 - $10,000", "Más de $10,000"] },
    { id: "goal", label: "¿Cuál es tu objetivo principal?", type: "select", options: ["Generar leads", "Vender online", "Posicionar marca", "Retargeting", "No sé por dónde empezar"] },
    { id: "details", label: "¿Algo más que debamos saber?", type: "textarea", placeholder: "Ej: audiencia objetivo, productos estrella, competencia..." },
  ],
  "website": [
    { id: "site_goal", label: "¿Cuál es el objetivo principal del sitio?", type: "select", options: ["Venta directa", "Captación de leads", "Informativo", "Portfolio"] },
    { id: "structure", label: "¿Qué secciones necesitas?", type: "textarea", placeholder: "Ej: Home, Nosotros, Servicios, Blog, Contacto..." },
    { id: "references", label: "¿Tienes referencias visuales o competencia?", type: "textarea", placeholder: "Ej: URLs de sitios que te gustan, competidores directos..." },
    { id: "brand_assets", label: "¿Cuentas con manual de marca y activos (fotos/textos)?", type: "select", options: ["Sí, completo", "Parcial (logo y colores)", "No tengo nada"] },
  ],
  "mvp": [
    { id: "problem", label: "¿Qué problema principal resuelve tu app?", type: "textarea", placeholder: "Describe el dolor o necesidad que tu producto soluciona..." },
    { id: "user_persona", label: "¿Quién es tu usuario final?", type: "textarea", placeholder: "Ej: dueños de pymes, equipos de ventas, consumidores finales..." },
    { id: "features", label: "¿Qué funcionalidades críticas necesitas?", type: "textarea", placeholder: "Ej: Login, Pagos, Dashboard, Notificaciones, Chat..." },
    { id: "integrations", label: "¿Necesitas integraciones con servicios externos?", type: "textarea", placeholder: "Ej: Stripe, HubSpot, Google Sheets, API propia..." },
    { id: "design_level", label: "¿Nivel de diseño requerido?", type: "select", options: ["Desde cero (diseño personalizado)", "Basado en template", "Ya tengo diseño (Figma/sketch)"] },
  ],
};

const leadSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  company: z.string().trim().max(100).optional(),
});

interface DynamicBriefFormProps {
  serviceType: string;
  serviceLabel: string;
}

const DynamicBriefForm = ({ serviceType, serviceLabel }: DynamicBriefFormProps) => {
  const questions = questionsByService[serviceType] || [];
  const [step, setStep] = useState<"contact" | "questions" | "success">("contact");
  const [loading, setLoading] = useState(false);
  const [contactData, setContactData] = useState({ name: "", email: "", company: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(contactData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setStep("questions");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const leadId = crypto.randomUUID();

      // Upsert lead by email — reuse existing lead if same email
      const { error: leadError } = await supabase
        .from("leads")
        .upsert(
          {
            id: leadId,
            name: contactData.name.trim(),
            email: contactData.email.trim(),
            company: contactData.company?.trim() || null,
            service_type: serviceType,
            status: "new",
          },
          { onConflict: "email", ignoreDuplicates: false }
        );

      if (leadError) throw leadError;

      // Get lead ID (might be existing if email matched)
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", contactData.email.trim())
        .maybeSingle();

      const finalLeadId = existingLead?.id || leadId;

      // Insertar brief
      const { error: briefError } = await supabase
        .from("brief_submissions")
        .insert({
          lead_id: finalLeadId,
          service_type: serviceType,
          answers,
        });

      if (briefError) throw briefError;

      setStep("success");
      toast.success("¡Brief enviado correctamente!");
    } catch (err: any) {
      toast.error("Error al enviar el brief. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 px-6">
        <CheckCircle size={48} className="text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">¡Gracias, {contactData.name}!</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Recibimos tu brief de <strong>{serviceLabel}</strong>. Nuestro equipo te contactará en las próximas 24 horas.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {step === "contact" && (
        <motion.form onSubmit={handleContactSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-6">Primero, cuéntanos quién eres.</p>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input id="name" value={contactData.name} onChange={(e) => setContactData((p) => ({ ...p, name: e.target.value }))} placeholder="Tu nombre" required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={contactData.email} onChange={(e) => setContactData((p) => ({ ...p, email: e.target.value }))} placeholder="tu@email.com" required maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" value={contactData.company} onChange={(e) => setContactData((p) => ({ ...p, company: e.target.value }))} placeholder="Nombre de tu empresa (opcional)" maxLength={100} />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Continuar
          </Button>
        </motion.form>
      )}

      {step === "questions" && (
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-6">Ahora, responde algunas preguntas sobre tu proyecto.</p>
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label>{q.label}</Label>
              {q.type === "select" && q.options ? (
                <Select value={answers[q.id] || ""} onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccioná una opción" /></SelectTrigger>
                  <SelectContent>
                    {q.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : q.type === "textarea" ? (
                <Textarea value={answers[q.id] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} placeholder={q.placeholder} maxLength={1000} />
              ) : (
                <Input value={answers[q.id] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} placeholder={q.placeholder} maxLength={500} />
              )}
            </div>
          ))}
          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Enviar brief
          </Button>
        </motion.form>
      )}
    </div>
  );
};

export default DynamicBriefForm;
