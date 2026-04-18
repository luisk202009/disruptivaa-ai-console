import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check, X, Copy } from "lucide-react";
import CountryCodeSelector from "./CountryCodeSelector";
import { DEFAULT_COUNTRY } from "@/lib/countryCodes";
import {
  WA_SHORT_BASE_URL,
  buildShortLink,
  generateSlug,
} from "@/lib/walink";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  WhatsAppLinkRow,
  checkSlugAvailable,
} from "@/hooks/useWhatsAppLinks";
import { useQueryClient } from "@tanstack/react-query";

const phoneSchema = z
  .string()
  .regex(/^\d+$/, "Solo dígitos")
  .min(7, "Mínimo 7 dígitos")
  .max(15, "Máximo 15 dígitos");
const slugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones")
  .min(3, "Mínimo 3 caracteres")
  .max(40, "Máximo 40 caracteres");

interface Props {
  initial?: WhatsAppLinkRow | null;
  isEdit?: boolean;
}

const WhatsAppLinkForm = ({ initial, isEdit }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const initDial = initial
    ? // try to extract first 1-4 digits matching common dial — fallback default
      DEFAULT_COUNTRY.dial
    : DEFAULT_COUNTRY.dial;

  const [dial, setDial] = useState(initDial);
  const [phone, setPhone] = useState(initial?.phone?.replace(/^\+?/, "") ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [message, setMessage] = useState(initial?.message ?? "");
  const [linkType, setLinkType] = useState<"chat" | "catalog">(
    initial?.link_type ?? "chat"
  );
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [submitting, setSubmitting] = useState(false);

  // If editing, the saved phone already contains the country code; show it directly
  useEffect(() => {
    if (initial?.phone) {
      setPhone(initial.phone);
      setDial("");
    }
  }, [initial?.phone]);

  // Slug availability with debounce
  useEffect(() => {
    if (isEdit) return; // Slug not editable in edit mode
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      setSlugStatus("invalid");
      return;
    }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      try {
        const ok = await checkSlugAvailable(slug);
        setSlugStatus(ok ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [slug, isEdit]);

  const fullPhone = isEdit ? phone : `${dial}${phone}`;
  const previewSlug = slug || "tu-slug";

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(buildShortLink(previewSlug));
    toast.success("Link copiado");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneCheck = phoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      toast.error(phoneCheck.error.errors[0].message);
      return;
    }

    if (!isEdit) {
      const slugCheck = slugSchema.safeParse(slug);
      if (!slugCheck.success) {
        toast.error(slugCheck.error.errors[0].message);
        return;
      }
      if (slugStatus !== "available") {
        toast.error("El slug no está disponible");
        return;
      }
    }

    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && initial) {
        const { error } = await supabase
          .from("whatsapp_links")
          .update({
            phone: fullPhone,
            message: linkType === "catalog" ? null : message,
            link_type: linkType,
          })
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("Link actualizado");
      } else {
        const { error } = await supabase.from("whatsapp_links").insert({
          user_id: user.id,
          slug,
          phone: fullPhone,
          message: linkType === "catalog" ? null : message,
          link_type: linkType,
        });
        if (error) throw error;
        toast.success("Link creado");
      }
      qc.invalidateQueries({ queryKey: ["whatsapp-links"] });
      navigate("/dashboard/ecosistema/whatsapp-links");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Phone */}
          <div className="space-y-2">
            <Label>Número de WhatsApp</Label>
            <div className="flex gap-2">
              {!isEdit && (
                <CountryCodeSelector value={dial} onChange={setDial} />
              )}
              <Input
                type="tel"
                inputMode="numeric"
                placeholder={isEdit ? "" : "3001234567"}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Sin espacios ni símbolos. {!isEdit && "Incluye el código de país automáticamente."}
            </p>
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label>Slug personalizado</Label>
            {isEdit ? (
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-3 py-2 rounded-md flex-1 break-all">
                  {WA_SHORT_BASE_URL}/{slug}
                </code>
                <Badge variant="secondary">No editable</Badge>
              </div>
            ) : (
              <>
                <div className="flex items-stretch rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                  <span className="bg-muted px-3 py-2 text-xs text-muted-foreground border-r border-input flex items-center break-all whitespace-nowrap">
                    www.disruptivaa.com/wa/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "")
                      )
                    }
                    placeholder="mi-slug"
                    className="flex-1 px-3 py-2 text-sm bg-background outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSlug(generateSlug())}
                    className="px-3 text-xs text-muted-foreground hover:text-foreground border-l border-input"
                  >
                    Aleatorio
                  </button>
                </div>
                <div className="text-xs flex items-center gap-1.5 min-h-[18px]">
                  {slugStatus === "checking" && (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span className="text-muted-foreground">Verificando...</span>
                    </>
                  )}
                  {slugStatus === "available" && (
                    <span className="text-green-500 flex items-center gap-1">
                      <Check size={12} /> Disponible
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="text-destructive flex items-center gap-1">
                      <X size={12} /> Ya está en uso
                    </span>
                  )}
                  {slugStatus === "invalid" && (
                    <span className="text-destructive flex items-center gap-1">
                      <X size={12} /> Solo letras, números y guiones (mín. 3)
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Tipo de link */}
          <div className="space-y-2">
            <Label>Tipo de link</Label>
            <div className="flex items-center gap-3 p-3 rounded-md border border-input">
              <Switch
                checked={linkType === "catalog"}
                onCheckedChange={(c) => setLinkType(c ? "catalog" : "chat")}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {linkType === "catalog" ? "Catálogo WA Business" : "Chat directo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {linkType === "catalog"
                    ? "Abre el catálogo de WhatsApp Business."
                    : "Abre un chat con tu mensaje predeterminado."}
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje */}
          {linkType === "chat" && (
            <div className="space-y-2">
              <Label>Mensaje predeterminado</Label>
              <Textarea
                value={message ?? ""}
                onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                placeholder="Ej: Hola, quiero más información sobre sus servicios"
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {(message ?? "").length}/300
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <Label>Vista previa del link</Label>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-3 py-2 rounded-md flex-1 break-all">
                {buildShortLink(previewSlug)}
              </code>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyPreview}
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/dashboard/ecosistema/whatsapp-links")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 size={14} className="mr-2 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Guardar link"}
        </Button>
      </div>
    </form>
  );
};

export default WhatsAppLinkForm;
