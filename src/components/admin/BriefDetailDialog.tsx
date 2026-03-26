import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { questionsByService } from "@/components/brief/DynamicBriefForm";

interface BriefSubmission {
  id: string;
  service_type: string;
  answers: Record<string, string>;
}

interface BriefDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType: string | null;
  submissions: BriefSubmission[];
  leadName: string;
}

const serviceLabels: Record<string, string> = {
  "crm-hubspot": "CRM HubSpot",
  "14-dias": "Negocio en 14 días",
  "shopify": "Shopify",
  "marketing-ads": "Marketing & Ads",
  "website": "Websites & Landings",
  "mvp": "MVP & Aplicaciones",
};

const BriefDetailDialog = ({ open, onOpenChange, serviceType, submissions, leadName }: BriefDetailDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = submissions[currentIndex];
  const currentServiceType = current?.service_type || serviceType;
  const questions = currentServiceType ? questionsByService[currentServiceType] || [] : [];
  const answers = (current?.answers || {}) as Record<string, string>;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setCurrentIndex(0); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Brief de {leadName}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{currentServiceType ? serviceLabels[currentServiceType] || currentServiceType : "—"}</Badge>
            {submissions.length > 1 && (
              <span className="text-xs text-muted-foreground">
                Envío {currentIndex + 1} de {submissions.length}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {submissions.length > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" disabled={currentIndex === 0} onClick={() => setCurrentIndex(i => i - 1)}>
              <ChevronLeft size={16} className="mr-1" /> Anterior
            </Button>
            <Button variant="ghost" size="sm" disabled={currentIndex === submissions.length - 1} onClick={() => setCurrentIndex(i => i + 1)}>
              Siguiente <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {!answers || Object.keys(answers).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Este envío no tiene respuestas de brief.</p>
        ) : (
          <div className="space-y-4 mt-2">
            {questions.map((q) => (
              <div key={q.id} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{q.label}</p>
                <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">
                  {answers[q.id] || <span className="italic text-muted-foreground">Sin respuesta</span>}
                </p>
              </div>
            ))}
            {Object.entries(answers)
              .filter(([key]) => !questions.find((q) => q.id === key))
              .map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">{key}</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">{value}</p>
                </div>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BriefDetailDialog;
