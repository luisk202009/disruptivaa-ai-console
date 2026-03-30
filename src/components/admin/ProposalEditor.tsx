import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, Check, ExternalLink } from "lucide-react";
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
  const [htmlContent, setHtmlContent] = useState("");
  const [leadId, setLeadId] = useState<string>("none");
  const [copied, setCopied] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

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
        setHtmlContent(proposal.html_content);
        setLeadId(proposal.lead_id ?? "none");
        setSavedSlug(proposal.slug);
      } else {
        setTitle("");
        setSlug("");
        setSlugManual(false);
        setHtmlContent("");
        setLeadId("none");
        setSavedSlug(null);
      }
      setCopied(false);
    }
  }, [open, proposal]);

  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const publicUrl = `${window.location.origin}/propuesta/${slug}`;

  const handleSave = async (status?: string) => {
    if (!title.trim() || !slug.trim()) {
      toast.error("Título y slug son requeridos");
      return;
    }

    try {
      const payload: any = {
        title: title.trim(),
        slug: slug.trim(),
        html_content: htmlContent,
        lead_id: leadId === "none" ? null : leadId,
      };
      if (status) payload.status = status;

      if (proposal) {
        await updateProposal.mutateAsync({ id: proposal.id, ...payload });
        toast.success("Propuesta actualizada");
      } else {
        if (status) payload.status = status;
        await createProposal.mutateAsync(payload);
        toast.success("Propuesta creada");
      }
      setSavedSlug(slug.trim());
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                placeholder="Propuesta Deco Struktura - Marzo"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="deco-struktura-2025"
                className="font-mono text-sm"
              />
            </div>
          </div>

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
            <Label>Código HTML de la Propuesta</Label>
            <Textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Pega aquí el código HTML completo de la propuesta..."
              className="font-mono text-xs min-h-[300px] leading-relaxed"
            />
          </div>

          {savedSlug && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                {`${window.location.origin}/propuesta/${savedSlug}`}
              </span>
              <Button variant="ghost" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <a href={`/propuesta/${savedSlug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                </a>
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => handleSave()} disabled={isLoading}>
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              Guardar borrador
            </Button>
            <Button onClick={() => handleSave("sent")} disabled={isLoading}>
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              Guardar y marcar enviada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalEditor;
