import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, Check, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { useProposals, type Proposal } from "@/hooks/useProposals";
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

interface ProposalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: Proposal | null;
}

const ProposalEditor = ({ open, onOpenChange, proposal }: ProposalEditorProps) => {
  const { createProposal, updateProposal } = useProposals();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [leadId, setLeadId] = useState<string>("none");
  const [status, setStatus] = useState("draft");
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
        setSavedSlug(proposal.slug);
      } else {
        setTitle("");
        setSlug("");
        setSlugManual(false);
        setCompanyName("");
        setLeadId("none");
        setStatus("draft");
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

  const handlePreview = async () => {
    if (!companyName.trim()) {
      toast.error("Ingresa el nombre de la empresa para ver la vista previa");
      return;
    }
    try {
      const res = await fetch("/proposal-template.html");
      const template = await res.text();
      const finalHtml = template.replaceAll("{{COMPANY_NAME}}", companyName.trim());
      setPreviewHtml(finalHtml);
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

          <div className="space-y-2">
            <Label>Nombre de la empresa (destinatario) *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Deco Struktura, Grupo Axo..."
            />
            <p className="text-xs text-muted-foreground">
              Este nombre reemplazará {"{{COMPANY_NAME}}"} en la plantilla de la propuesta.
            </p>
          </div>

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
