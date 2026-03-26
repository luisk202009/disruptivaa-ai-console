import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { questionsByService } from "@/components/brief/DynamicBriefForm";

interface BriefDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType: string | null;
  answers: Record<string, string> | null;
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

const BriefDetailDialog = ({ open, onOpenChange, serviceType, answers, leadName }: BriefDetailDialogProps) => {
  const questions = serviceType ? questionsByService[serviceType] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Brief de {leadName}</DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="mt-1">{serviceType ? serviceLabels[serviceType] || serviceType : "—"}</Badge>
          </DialogDescription>
        </DialogHeader>

        {!answers || Object.keys(answers).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Este lead no tiene respuestas de brief.</p>
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
            {/* Show any extra keys not in questions */}
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
