import { forwardRef, useImperativeHandle, useRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

export interface QRHandle {
  downloadPNG: (filename?: string) => void;
  downloadSVG: (filename?: string) => void;
}

interface Props {
  value: string;
  size?: number;
  logoUrl?: string | null;
}

const WhatsAppQRCode = forwardRef<QRHandle, Props>(
  ({ value, size = 280, logoUrl }, ref) => {
    const canvasWrapRef = useRef<HTMLDivElement>(null);
    const svgWrapRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      downloadPNG: (filename = "whatsapp-qr.png") => {
        const canvas = canvasWrapRef.current?.querySelector("canvas");
        if (!canvas) return;
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      },
      downloadSVG: (filename = "whatsapp-qr.svg") => {
        const svg = svgWrapRef.current?.querySelector("svg");
        if (!svg) return;
        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const blob = new Blob([source], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      },
    }));

    const imageSettings = logoUrl
      ? {
          src: logoUrl,
          height: Math.round(size * 0.18),
          width: Math.round(size * 0.18),
          excavate: true,
        }
      : undefined;

    return (
      <>
        <div
          ref={canvasWrapRef}
          className="bg-white p-4 rounded-lg inline-block"
        >
          <QRCodeCanvas
            value={value}
            size={size}
            fgColor="#25D366"
            bgColor="#FFFFFF"
            level="H"
            imageSettings={imageSettings}
          />
        </div>
        {/* Hidden SVG for download */}
        <div ref={svgWrapRef} className="hidden">
          <QRCodeSVG
            value={value}
            size={size}
            fgColor="#25D366"
            bgColor="#FFFFFF"
            level="H"
            imageSettings={imageSettings}
          />
        </div>
      </>
    );
  }
);

WhatsAppQRCode.displayName = "WhatsAppQRCode";
export default WhatsAppQRCode;
