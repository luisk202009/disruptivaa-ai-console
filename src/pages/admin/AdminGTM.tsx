import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSiteSetting, useUpdateSiteSetting } from "@/hooks/useSiteSetting";
import { GTM_SETTINGS_KEY, type GTMSettings } from "@/components/GTMInjector";

const HEAD_PLACEHOLDER = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`;

const BODY_PLACEHOLDER = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

const AdminGTM = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useSiteSetting<GTMSettings>(GTM_SETTINGS_KEY);
  const updateSetting = useUpdateSiteSetting();

  const [headCode, setHeadCode] = useState("");
  const [bodyCode, setBodyCode] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setHeadCode(data.head_code || "");
      setBodyCode(data.body_code || "");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({
        key: GTM_SETTINGS_KEY,
        value: { head_code: headCode, body_code: bodyCode } satisfies GTMSettings,
      });
      toast.success("Configuración guardada correctamente");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err: any) {
      toast.error("Error al guardar la configuración", {
        description: err?.message,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate("/admin/settings")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a Ajustes
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">
          Integración de Google Tag Manager
        </h1>
        <p className="text-sm text-muted-foreground">
          Pega los dos fragmentos de código que te proporciona Google Tag Manager. Se inyectarán
          automáticamente en todas las páginas del sitio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fragmentos de GTM</CardTitle>
          <CardDescription>
            El primer fragmento se coloca en el <code>&lt;head&gt;</code> y el segundo justo después
            de la apertura de <code>&lt;body&gt;</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gtm-head">Código para el HEAD</Label>
            <Textarea
              id="gtm-head"
              value={headCode}
              onChange={(e) => setHeadCode(e.target.value)}
              placeholder={HEAD_PLACEHOLDER}
              className="font-mono text-xs min-h-[180px]"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gtm-body">Código para el BODY (Noscript)</Label>
            <Textarea
              id="gtm-body"
              value={bodyCode}
              onChange={(e) => setBodyCode(e.target.value)}
              placeholder={BODY_PLACEHOLDER}
              className="font-mono text-xs min-h-[140px]"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateSetting.isPending || isLoading}
            >
              {updateSetting.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar configuración
            </Button>
            {justSaved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                <CheckCircle2 size={16} />
                Configuración guardada correctamente
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGTM;
