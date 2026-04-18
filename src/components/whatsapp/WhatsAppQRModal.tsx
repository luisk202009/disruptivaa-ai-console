import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import WhatsAppQRCode, { QRHandle } from "./WhatsAppQRCode";
import { buildShortLink } from "@/lib/walink";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
}

const WhatsAppQRModal = ({ open, onOpenChange, slug }: Props) => {
  const qrRef = useRef<QRHandle>(null);
  const { logoUrl } = useCompanyBranding();
  const url = buildShortLink(slug);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código QR del link</DialogTitle>
          <DialogDescription>
            Escanea o descarga este código QR para compartir tu link de WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <WhatsAppQRCode ref={qrRef} value={url} size={280} logoUrl={logoUrl} />
          <p className="text-xs text-muted-foreground break-all text-center px-4">
            {url}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => qrRef.current?.downloadPNG(`wa-${slug}.png`)}
          >
            <Download size={16} className="mr-2" />
            Descargar PNG
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => qrRef.current?.downloadSVG(`wa-${slug}.svg`)}
          >
            <Download size={16} className="mr-2" />
            Descargar SVG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppQRModal;
