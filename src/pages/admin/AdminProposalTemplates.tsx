import { useState, useMemo, useCallback } from "react";
import { useProposalTemplates, ProposalTemplate } from "@/hooks/useProposalTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Pencil, Save, Loader2, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const PLACEHOLDER_MAP: Record<string, string> = {
  "{{COMPANY_NAME}}": "Empresa Demo",
  "{{PROPOSAL_DATE}}": new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
  "{{PRICE}}": "$2,500 USD",
  "{{PAYMENT_TYPE_LABEL}}": "Pago único",
  "{{TERMS_CONDITIONS}}": "Términos y condiciones de ejemplo para la vista previa.",
  "{{CTA_PRIMARY_URL}}": "#",
  "{{CTA_SECONDARY_URL}}": "#",
};

function replacePlaceholders(html: string) {
  let result = html;
  for (const [key, value] of Object.entries(PLACEHOLDER_MAP)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

// Debounce hook
function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  });
  // Use useMemo with a ref approach instead
  const [, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  useMemo(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    setTimer((prev) => {
      if (prev) clearTimeout(prev);
      return t;
    });
  }, [value, delay]);

  return debounced;
}

const TemplateList = ({ templates, onEdit }: { templates: ProposalTemplate[]; onEdit: (t: ProposalTemplate) => void }) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-6">Plantillas de Propuestas</h1>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <Card key={t.id} className="p-5 flex flex-col gap-3 bg-card border-border">
          <div className="flex items-center gap-3">
            <FileCode2 size={20} className="text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{t.service_type}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t.html_content.length > 0
              ? `${(t.html_content.length / 1024).toFixed(1)} KB de HTML`
              : "Sin contenido"}
          </p>
          <Button variant="outline" size="sm" className="mt-auto self-start" onClick={() => onEdit(t)}>
            <Pencil size={14} className="mr-1.5" /> Editar
          </Button>
        </Card>
      ))}
    </div>
  </div>
);

const TemplateEditor = ({
  template,
  onBack,
}: {
  template: ProposalTemplate;
  onBack: () => void;
}) => {
  const { updateTemplate } = useProposalTemplates();
  const [name, setName] = useState(template.name);
  const [serviceType, setServiceType] = useState(template.service_type);
  const [htmlContent, setHtmlContent] = useState(template.html_content);

  const debouncedHtml = useDebouncedValue(htmlContent, 500);
  const previewHtml = useMemo(() => replacePlaceholders(debouncedHtml), [debouncedHtml]);

  const handleSave = useCallback(async () => {
    try {
      await updateTemplate.mutateAsync({ id: template.id, name, service_type: serviceType, html_content: htmlContent });
      toast.success("Plantilla guardada correctamente");
    } catch {
      toast.error("Error al guardar la plantilla");
    }
  }, [updateTemplate, template.id, name, serviceType, htmlContent]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="shrink-0 flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} className="mr-1.5" /> Volver
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-56 h-8 text-sm"
          placeholder="Nombre"
        />
        <Input
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="w-44 h-8 text-sm font-mono"
          placeholder="service_type"
        />
        <Button size="sm" onClick={handleSave} disabled={updateTemplate.isPending}>
          {updateTemplate.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
          Guardar
        </Button>
      </div>

      {/* Split editor */}
      <div className="flex-1 min-h-0 mt-4">
        <ResizablePanelGroup direction="horizontal" className="rounded-lg border border-border">
          <ResizablePanel defaultSize={50} minSize={25}>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full h-full resize-none bg-background text-foreground p-4 text-xs leading-relaxed focus:outline-none"
              style={{ fontFamily: "ui-monospace, 'Fira Code', monospace", tabSize: 2, whiteSpace: "pre" }}
              spellCheck={false}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={25}>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full bg-white"
              sandbox="allow-same-origin"
              title="Vista previa"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

const AdminProposalTemplates = () => {
  const { data: templates, isLoading } = useProposalTemplates();
  const [editing, setEditing] = useState<ProposalTemplate | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (editing) {
    return <TemplateEditor template={editing} onBack={() => setEditing(null)} />;
  }

  return <TemplateList templates={templates || []} onEdit={setEditing} />;
};

export default AdminProposalTemplates;
