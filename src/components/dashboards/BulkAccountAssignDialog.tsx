import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Widget } from "@/hooks/useWidgets";
import { MetaAccountDetail } from "@/hooks/useIntegrations";
import { cn } from "@/lib/utils";

const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  manual: "Manual",
};

interface BulkAccountAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: Widget[];
  accounts: MetaAccountDetail[];
  accountsLoading?: boolean;
  onAssign: (accountId: string, accountName: string) => Promise<void>;
  platform?: string;
}

export const BulkAccountAssignDialog = ({
  open,
  onOpenChange,
  widgets,
  accounts,
  accountsLoading,
  onAssign,
  platform = "meta_ads",
}: BulkAccountAssignDialogProps) => {
  const platformName = PLATFORM_DISPLAY_NAMES[platform] || platform;
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedAccount) return;

    const account = accounts.find((a) => a.id === selectedAccount);
    if (!account) return;

    setLoading(true);
    try {
      await onAssign(selectedAccount, account.name);
      onOpenChange(false);
      setSelectedAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedAccount(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Vincular cuenta de {platformName}</DialogTitle>
          <DialogDescription>
            Selecciona una cuenta para vincularla a {widgets.length} widget
            {widgets.length > 1 ? "s" : ""} sin configurar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-4">
          {accountsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Cargando cuentas...
              </span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No hay cuentas de {platformName} vinculadas.
              </p>
              <p className="text-sm text-muted-foreground">
                Ve a Conexiones para añadir una cuenta de {platformName}.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:border-primary/50",
                    selectedAccount === account.id &&
                      "border-primary bg-primary/5 ring-1 ring-primary"
                  )}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {account.id}
                      </p>
                    </div>
                    {selectedAccount === account.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedAccount || loading || accounts.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vinculando...
              </>
            ) : (
              `Vincular a ${widgets.length} widget${widgets.length > 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
