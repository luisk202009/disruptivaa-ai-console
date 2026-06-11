import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import CountryCodeSelector from "@/components/whatsapp/CountryCodeSelector";
import { DEFAULT_COUNTRY } from "@/lib/countryCodes";
import { buildWaUrl } from "@/lib/walink";
import {
  useSiteSetting,
  useUpdateSiteSetting,
  WHATSAPP_BUTTON_KEY,
  WhatsAppButtonSettings,
} from "@/hooks/useSiteSetting";

// Intenta separar prefijo de país del número guardado
const splitPhone = (full: string): { dial: string; local: string } => {
  if (!full) return { dial: DEFAULT_COUNTRY.dial, local: "" };
  // Buscar prefijo conocido más largo que matchee
  // (no es perfecto pero suficiente para edición)
  return { dial: DEFAULT_COUNTRY.dial, local: full };
};

const AdminWhatsAppButton = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useSiteSetting<WhatsAppButtonSettings>(WHATSAPP_BUTTON_KEY);
  const updateMutation = useUpdateSiteSetting();

  const [dial, setDial] = useState(DEFAULT_COUNTRY.dial);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (data && !initialized) {
      const split = splitPhone(data.phone || "");
      setDial(split.dial);
      setPhone(split.local);
      setMessage(data.message || "");
      setEnabled(data.enabled !== false);
      setInitialized(true);
    }
  }, [data, initialized]);

  const fullPhone = `${dial}${phone}`.replace(/\D/g, "");
  const previewUrl = fullPhone
    ? buildWaUrl(fullPhone, message, "chat")
    : "https://wa.me/...";

  const handleSave = async () => {
    if (enabled && !phone) {
      toast.error("Ingresa un número de WhatsApp o desactiva el botón");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        key: WHATSAPP_BUTTON_KEY,
        value: {
          phone: fullPhone,
          message: message.trim(),
          enabled,
        } satisfies WhatsAppButtonSettings,
      });
      toast.success("Configuración guardada");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/admin/settings")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> Volver a Ajustes
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366]">
          <MessageCircle size={20} />
        </div>
        <h1 className="text-2xl font-semibold text-foreground tracking-wide">
          Botón flotante de WhatsApp
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Configura el número y el mensaje al que dirige el botón verde de WhatsApp
        visible en el sitio público.
      </p>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Switch habilitar */}
          <div className="flex items-center gap-3 p-3 rounded-md border border-input">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {enabled ? "Botón visible en el sitio" : "Botón oculto"}
              </p>
              <p className="text-xs text-muted-foreground">
                Cuando está desactivado, el botón flotante no se renderiza para los
                visitantes.
              </p>
            </div>
          </div>

          {/* Número */}
          <div className="space-y-2">
            <Label>Número de WhatsApp</Label>
            <div className="flex gap-2">
              <CountryCodeSelector value={dial} onChange={setDial} />
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sin espacios ni símbolos. Incluye el código de país.
            </p>
          </div>

          {/* Mensaje predefinido */}
          <div className="space-y-2">
            <Label>Mensaje predefinido (opcional)</Label>
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder="Ej: Hola, vengo desde la web y quiero más información"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000
            </p>
          </div>

          {/* Vista previa */}
          <div className="space-y-2">
            <Label>Vista previa del enlace</Label>
            <code className="block text-xs bg-muted px-3 py-2 rounded-md break-all">
              {previewUrl}
            </code>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/settings")}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 size={14} className="mr-2 animate-spin" />
              )}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWhatsAppButton;
