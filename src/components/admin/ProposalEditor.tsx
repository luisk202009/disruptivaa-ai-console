import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, Check, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { useProposals, type Proposal } from "@/hooks/useProposals";
import { useProposalTemplates } from "@/hooks/useProposalTemplates";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const paymentTypeLabels: Record<string, string> = {
  one_time: "Pago Único",
  monthly: "Mensual",
  annual: "Anual",
  custom: "Acuerdo de pago",
};

interface ProposalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: Proposal | null;
}

const ProposalEditor = ({ open, onOpenChange, proposal }: ProposalEditorProps) => {
  const { createProposal, updateProposal } = useProposals();
  const templatesQuery = useProposalTemplates();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [leadId, setLeadId] = useState<string>("none");
  const [status, setStatus] = useState("draft");
  const [ctaPrimaryUrl, setCtaPrimaryUrl] = useState("");
  const [ctaSecondaryUrl, setCtaSecondaryUrl] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState("");
  const [paymentType, setPaymentType] = useState("one_time");
  const [termsConditions, setTermsConditions] = useState("");
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().slice(0, 10));
  const [copied, setCopied] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const leadsQuery = useQuery({
    queryKey: ["leads-list"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, name, email, company").order("name");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (open) {
      if (proposal) {
        setTitle(proposal.title);
        setSlug(proposal.slug);
        setSlugManual(true);
        setCompanyName(proposal.company_name || "");
        setLeadId(proposal.lead_id ?? "none");
        setStatus(proposal.status);
        setCtaPrimaryUrl(proposal.cta_primary_url || "");
        setCtaSecondaryUrl(proposal.cta_secondary_url || "");
        setServiceType(proposal.service_type || "");
        setPrice(proposal.price || "");
        setPaymentType(proposal.payment_type || "one_time");
        setTermsConditions(proposal.terms_conditions || "");
        setProposalDate(proposal.proposal_date || new Date().toISOString().slice(0, 10));
        setSavedSlug(proposal.slug);
      } else {
        setTitle("");
        setSlug("");
        setSlugManual(false);
        setCompanyName("");
        setLeadId("none");
        setStatus("draft");
        setCtaPrimaryUrl("");
        setCtaSecondaryUrl("");
        setServiceType("");
        setPrice("");
        setPaymentType("one_time");
        setTermsConditions("");
        setProposalDate(new Date().toISOString().slice(0, 10));
        setSavedSlug(null);
      }
      setCopied(false);
      setShowPreview(false);
      setPreviewHtml(null);
    }
  }, [open, proposal]);

  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const publicUrl = `${window.location.origin}/p/${slug}`;

  const injectPlaceholders = (template: string) => {
    const dateFormatted = proposalDate
      ? new Date(proposalDate + "T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" })
      : "2026";

    return template
      .split("{{COMPANY_NAME}}").join(companyName.trim() || "Empresa")
      .split("{{CTA_PRIMARY_URL}}").join(ctaPrimaryUrl || "#")
      .split("{{CTA_SECONDARY_URL}}").join(ctaSecondaryUrl || "https://www.disruptivaa.com")
      .split("{{PROPOSAL_DATE}}").join(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1))
      .split("{{PRICE}}").join(price || "—")
      .split("{{PAYMENT_TYPE_LABEL}}").join(paymentTypeLabels[paymentType] || "Pago Único")
      .split("{{TERMS_CONDITIONS}}").join(termsConditions || "")
      .split("{{TERMS_DISPLAY}}").join(termsConditions.trim() ? "block" : "none");
  };

  const handlePreview = async () => {
    if (!companyName.trim()) {
      toast.error("Ingresa el nombre de la empresa para ver la vista previa");
      return;
    }
    try {
      let template: string;
      // Try to get template from DB based on service_type
      if (serviceType) {
        const selected = templatesQuery.data?.find((t) => t.service_type === serviceType);
        if (selected && selected.html_content.trim()) {
          template = selected.html_content;
        } else {
          // Fallback to static file
          const res = await fetch("/proposal-template.html");
          template = await res.text();
        }
      } else {
        const res = await fetch("/proposal-template.html");
        template = await res.text();
      }

      setPreviewHtml(injectPlaceholders(template));
      setShowPreview(true);
    } catch {
      toast.error("Error al cargar la plantilla");
    }
  };

  const handleSave = async (overrideStatus?: string) => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Título y slug son requeridos");
      return;
    }
    if (!companyName.trim()) {
      toast.error("El nombre de la empresa es requerido");
      return;
    }

    try {
      const payload: any = {
        title: title.trim(),
        slug: slug.trim(),
        company_name: companyName.trim(),
        lead_id: leadId === "none" ? null : leadId,
        status: overrideStatus || status,
        cta_primary_url: ctaPrimaryUrl.trim(),
        cta_secondary_url: ctaSecondaryUrl.trim(),
        service_type: serviceType,
        price: price.trim(),
        payment_type: paymentType,
        terms_conditions: termsConditions.trim(),
        proposal_date: proposalDate,
      };

      if (proposal) {
        await updateProposal.mutateAsync({ id: proposal.id, ...payload });
        toast.success("Propuesta actualizada");
      } else {
        await createProposal.mutateAsync(payload);
        toast.success("Propuesta creada");
      }
      setSavedSlug(slug.trim());
      if (overrideStatus) setStatus(overrideStatus);
    } catch (e: any) {
      if (e.message?.includes("duplicate key") || e.message?.includes("unique")) {
        toast.error("El slug ya existe. Elige uno diferente.");
      } else {
        toast.error("Error al guardar: " + e.message);
      }
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = createProposal.isPending || updateProposal.isPending;

  if (showPreview && previewHtml) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>Vista previa — {companyName}</span>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Volver al editor
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-2 pb-2">
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              sandbox="allow-same-origin"
              className="w-full h-full min-h-[70vh] border rounded-lg"
              title="Vista previa propuesta"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{proposal ? "Editar Propuesta" : "Nueva Propuesta"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Row 1: Title + Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Propuesta Empresa X - Marzo"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="empresa-x-2025"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Row 2: Company name */}
          <div className="space-y-2">
            <Label>Nombre de la empresa (destinatario) *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Deco Struktura, Grupo Axo..."
            />
          </div>

          {/* Row 3: Service + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servicio (plantilla)</Label>
              <Select value={serviceType || "none"} onValueChange={(v) => setServiceType(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Plantilla por defecto —</SelectItem>
                  {templatesQuery.data?.map((t) => (
                    <SelectItem key={t.id} value={t.service_type}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de propuesta</Label>
              <Input
                type="date"
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Price + Payment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ej: 1,200 USD"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">Pago Único</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                  <SelectItem value="custom">Acuerdo de pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Lead + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lead vinculado (opcional)</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin lead vinculado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin lead vinculado</SelectItem>
                  {leadsQuery.data?.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} — {lead.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="viewed">Vista</SelectItem>
                  <SelectItem value="accepted">Aceptada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 6: CTAs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL "Agendar reunión" (CTA principal)</Label>
              <Input
                value={ctaPrimaryUrl}
                onChange={(e) => setCtaPrimaryUrl(e.target.value)}
                placeholder="https://calendly.com/tu-empresa/reunion"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>URL "Ver nuestro trabajo" (CTA secundario)</Label>
              <Input
                value={ctaSecondaryUrl}
                onChange={(e) => setCtaSecondaryUrl(e.target.value)}
                placeholder="https://www.disruptivaa.com"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Row 7: Terms */}
          <div className="space-y-2">
            <Label>Términos y condiciones (opcional)</Label>
            <Textarea
              value={termsConditions}
              onChange={(e) => setTermsConditions(e.target.value)}
              placeholder="Ej: Esta propuesta es válida por 30 días. Los precios no incluyen IVA..."
              rows={4}
            />
          </div>

          {savedSlug && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                {`${window.location.origin}/p/${savedSlug}`}
              </span>
              <Button variant="ghost" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <a href={`/p/${savedSlug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                </a>
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={handlePreview} className="gap-2">
              <Eye size={14} /> Vista previa
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button variant="secondary" onClick={() => handleSave()} disabled={isLoading}>
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                Guardar
              </Button>
              <Button onClick={() => handleSave("sent")} disabled={isLoading}>
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                Guardar y enviar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalEditor;
