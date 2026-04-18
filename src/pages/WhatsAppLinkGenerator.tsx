import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import PublicLayout from "@/components/landing/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ExternalLink, Download, Sparkles, Loader2 } from "lucide-react";
import CountryCodeSelector from "@/components/whatsapp/CountryCodeSelector";
import WhatsAppPhonePreview from "@/components/whatsapp/WhatsAppPhonePreview";
import WhatsAppQRCode, { QRHandle } from "@/components/whatsapp/WhatsAppQRCode";
import { DEFAULT_COUNTRY } from "@/lib/countryCodes";
import { buildShortLink, buildWaUrl, generateSlug } from "@/lib/walink";
import { supabase } from "@/integrations/supabase/client";

const phoneSchema = z.string().regex(/^\d+$/).min(7).max(15);

const WhatsAppLinkGenerator = () => {
  const [dial, setDial] = useState(DEFAULT_COUNTRY.dial);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    slug: string;
    phone: string;
    message: string;
  } | null>(null);
  const qrRef = useRef<QRHandle>(null);

  const fullPhone = `${dial}${phone}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneSchema.safeParse(phone).success) {
      toast.error("Ingresa un número válido (mínimo 7 dígitos)");
      return;
    }
    setLoading(true);
    try {
      // Generate unique slug, retry if collision
      let slug = generateSlug();
      for (let i = 0; i < 5; i++) {
        const { data: ok } = await supabase.rpc("check_slug_available", {
          p_slug: slug,
        });
        if (ok) break;
        slug = generateSlug();
      }
      const { error } = await supabase.from("whatsapp_links").insert({
        slug,
        phone: fullPhone,
        message: message || null,
        link_type: "chat",
      });
      if (error) throw error;
      setResult({ slug, phone: fullPhone, message });
      toast.success("¡Link creado!");
    } catch (err: any) {
      toast.error(err.message || "Error al generar el link");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPhone("");
    setMessage("");
  };

  const copyLink = () => {
    if (!result) return;
    navigator.clipboard.writeText(buildShortLink(result.slug));
    toast.success("Link copiado");
  };

  return (
    <PublicLayout>
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Generador de Links de WhatsApp
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Crea links cortos profesionales para WhatsApp con QR descargable.
              Sin registro, gratis y al instante.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* LEFT: form / result */}
            <div>
              {!result ? (
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label>Número de WhatsApp</Label>
                        <div className="flex gap-2">
                          <CountryCodeSelector value={dial} onChange={setDial} />
                          <Input
                            type="tel"
                            inputMode="numeric"
                            placeholder="3001234567"
                            value={phone}
                            onChange={(e) =>
                              setPhone(e.target.value.replace(/\D/g, ""))
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Mensaje predeterminado (opcional)</Label>
                        <Textarea
                          value={message}
                          onChange={(e) =>
                            setMessage(e.target.value.slice(0, 300))
                          }
                          placeholder="Ej: Hola, quiero más información sobre sus servicios"
                          rows={5}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {message.length}/300
                        </p>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading && (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        )}
                        Generar link
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6 space-y-5">
                    <div className="space-y-2">
                      <Label>Tu link corto</Label>
                      <div className="flex gap-2">
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md break-all">
                          {buildShortLink(result.slug)}
                        </code>
                        <Button size="icon" variant="outline" onClick={copyLink}>
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        window.open(
                          buildWaUrl(result.phone, result.message, "chat"),
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink size={14} className="mr-2" />
                      Probar link
                    </Button>

                    <div className="flex flex-col items-center gap-3 pt-2 border-t border-border">
                      <WhatsAppQRCode
                        ref={qrRef}
                        value={buildShortLink(result.slug)}
                        size={240}
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          qrRef.current?.downloadPNG(`wa-${result.slug}.png`)
                        }
                      >
                        <Download size={14} className="mr-2" />
                        Descargar QR
                      </Button>
                    </div>

                    <Button variant="ghost" className="w-full" onClick={reset}>
                      Crear otro link
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT: live preview */}
            <div className="flex items-start justify-center pt-6">
              <WhatsAppPhonePreview phone={fullPhone} message={message} />
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="text-primary" size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  ¿Quieres un link con tu nombre, analítica de clics y QR con tu logo?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crea tu cuenta y desbloquea links personalizados ilimitados.
                </p>
              </div>
            </div>
            <Link to="/auth">
              <Button size="lg">Crear cuenta gratis</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default WhatsAppLinkGenerator;
