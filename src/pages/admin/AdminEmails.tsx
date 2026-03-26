import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Eye, Copy } from "lucide-react";

const AdminEmails = () => {
  const { t } = useTranslation();
  const [emailTemplate, setEmailTemplate] = useState("confirmation");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">Email</h1>
      <p className="text-sm text-muted-foreground mb-8">Configura las plantillas de correo electrónico.</p>

      <div className="space-y-6">
        <div className="p-5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Mail size={18} className="text-primary" /><h3 className="font-medium text-foreground">{t("admin.emailTemplate")}</h3></div>
          <div className="space-y-4">
            <Select value={emailTemplate} onValueChange={setEmailTemplate}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmation">{t("admin.emailConfirmation")}</SelectItem>
                <SelectItem value="recovery">{t("admin.emailRecovery")}</SelectItem>
                <SelectItem value="magiclink">{t("admin.emailMagicLink")}</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("admin.emailSubject")}</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={emailTemplate === "confirmation" ? "Confirma tu cuenta" : emailTemplate === "magiclink" ? "Tu enlace de acceso" : "Recupera tu contraseña"}
                className="bg-white/[0.03] border-white/[0.08]" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("admin.emailBody")}</label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                placeholder="<h1>Hola {{ .Name }}</h1><p>...</p>"
                className="bg-white/[0.03] border-white/[0.08] font-mono text-xs min-h-[200px]" rows={10} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!emailBody} className="border-white/10">
                <Eye size={14} className="mr-2" />{t("admin.emailPreview")}
              </Button>
              <Button onClick={() => { navigator.clipboard.writeText(emailBody); toast.success(t("admin.emailCopied")); }} disabled={!emailBody}>
                <Copy size={14} className="mr-2" />{t("admin.emailSave")}
              </Button>
            </div>
            {(emailTemplate === "confirmation" || emailTemplate === "magiclink") && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400">⚠️ Esta plantilla requiere la variable <code className="bg-white/10 px-1 rounded">{"{{ .ConfirmationURL }}"}</code> para el enlace de acción.</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground border-t border-white/[0.06] pt-3">💡 {t("admin.emailNote")}</p>
          </div>
        </div>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl bg-background border-white/[0.08] max-h-[80vh]">
          <DialogHeader><DialogTitle className="text-foreground">{t("admin.emailPreview")}</DialogTitle></DialogHeader>
          <div className="rounded-lg overflow-hidden border border-white/[0.06]">
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:#000;font-family:'Fira Sans',Arial,sans-serif;}</style></head><body><div style="max-width:600px;margin:0 auto;background:#000;padding:40px 24px;"><div style="text-align:center;margin-bottom:32px;"><h2 style="color:#fff;font-size:18px;margin:0;">Disruptivaa</h2></div><div style="background:#111;border-radius:12px;padding:32px 24px;border:1px solid rgba(255,255,255,0.06);">${emailBody || '<p style="color:#888;text-align:center;">Sin contenido</p>'}</div><p style="color:#555;font-size:11px;text-align:center;margin-top:24px;">© ${new Date().getFullYear()} Disruptivaa. Todos los derechos reservados.</p></div></body></html>`}
              className="w-full h-[400px] bg-black"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmails;
