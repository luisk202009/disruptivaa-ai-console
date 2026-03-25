import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, CheckCircle } from "lucide-react";

const ContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("leads" as any).insert({
      name: form.name.trim().slice(0, 100),
      email: form.email.trim().slice(0, 255),
      company: form.company.trim().slice(0, 100) || null,
      service_type: "landing_contact",
      status: "new",
    });

    setLoading(false);
    if (error) {
      toast.error("Error al enviar. Intenta de nuevo.");
      return;
    }
    setSent(true);
    toast.success("¡Mensaje enviado! Te contactaremos pronto.");
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">¡Recibido!</h3>
        <p className="text-sm text-zinc-400">Nuestro equipo se pondrá en contacto contigo pronto.</p>
      </motion.div>
    );
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-semibold mb-3">Contacto</p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight mb-3">
              ¿Listo para escalar?
            </h2>
            <p className="text-sm text-zinc-400">Dejanos tus datos y te contactamos en menos de 24hs.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/[0.06] bg-card/50 backdrop-blur-sm p-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-400 text-xs uppercase tracking-wider">Nombre</Label>
              <Input
                id="name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre"
                className="bg-background/50 border-white/[0.08]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400 text-xs uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@empresa.com"
                className="bg-background/50 border-white/[0.08]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-zinc-400 text-xs uppercase tracking-wider">Empresa (opcional)</Label>
              <Input
                id="company"
                maxLength={100}
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Nombre de tu empresa"
                className="bg-background/50 border-white/[0.08]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(213,100%,48%)] hover:bg-[hsl(213,100%,42%)] text-white border-0 h-11"
            >
              {loading ? "Enviando..." : (
                <>
                  <Send size={16} className="mr-2" />
                  Enviar mensaje
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactForm;
