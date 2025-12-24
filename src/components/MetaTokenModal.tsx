import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, Key, AlertCircle, CheckCircle2 } from "lucide-react";

interface MetaTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (accessToken: string) => Promise<{ success: boolean; error?: string; accountsCount?: number }>;
  isConnecting: boolean;
}

const MetaTokenModal = ({ open, onOpenChange, onConnect, isConnecting }: MetaTokenModalProps) => {
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken.trim()) {
      setError("El token de acceso es requerido");
      return;
    }

    setError(null);
    const result = await onConnect(accessToken.trim());
    
    if (result.success) {
      setAccessToken("");
      onOpenChange(false);
    } else {
      setError(result.error || "Error al validar el token");
    }
  };

  const handleClose = () => {
    setAccessToken("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="text-primary" size={20} />
            Conectar Meta Ads
          </DialogTitle>
          <DialogDescription>
            Ingresa tu Access Token de Meta para conectar tu cuenta de anuncios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="EAAxxxxxxxx..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isConnecting}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm space-y-2">
            <p className="font-medium text-foreground">¿Cómo obtener tu Access Token?</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Ve a <a 
                href="https://developers.facebook.com/tools/explorer/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Meta Graph API Explorer <ExternalLink size={12} />
              </a></li>
              <li>Selecciona tu aplicación de Meta</li>
              <li>Genera un token con permisos de <code className="bg-muted px-1 rounded">ads_read</code></li>
              <li>Copia el Access Token y pégalo aquí</li>
            </ol>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isConnecting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isConnecting || !accessToken.trim()}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2" size={16} />
                  Conectar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MetaTokenModal;
