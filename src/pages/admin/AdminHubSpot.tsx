import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  PlugZap,
  Workflow,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  useHubSpotConfig,
  useUpdateHubSpotConfig,
  useHubSpotSyncLog,
  LEAD_FIELDS,
} from "@/hooks/useHubSpotConfig";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface HubSpotProperty {
  name: string;
  label: string;
  type: string;
  groupName: string;
}

const AdminHubSpot = () => {
  const navigate = useNavigate();
  const { data: config, isLoading } = useHubSpotConfig();
  const updateConfig = useUpdateHubSpotConfig();
  const { data: log } = useHubSpotSyncLog();

  const [properties, setProperties] = useState<HubSpotProperty[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    if (config) {
      setMapping(config.field_mapping || {});
      setEnabled(config.enabled);
      setAutoSync(config.auto_sync);
    }
  }, [config]);

  // Probar conexión y cargar propiedades al entrar
  useEffect(() => {
    void testConnection();
  }, []);

  async function testConnection() {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("hubspot-test-connection");
      if (error) throw error;
      if (data?.ok) {
        setConnected(true);
        setAccountName(data.account?.portalId ? `Portal ${data.account.portalId}` : "Cuenta HubSpot");
        await loadProperties();
      } else {
        setConnected(false);
        toast.error("HubSpot no conectado", { description: data?.error || "Conecta la Service Key" });
      }
    } catch (e: any) {
      setConnected(false);
      toast.error("Error al probar conexión", { description: e.message });
    } finally {
      setTesting(false);
    }
  }

  async function loadProperties() {
    setLoadingProps(true);
    try {
      const { data, error } = await supabase.functions.invoke("hubspot-list-properties");
      if (error) throw error;
      if (data?.ok) setProperties(data.properties);
    } catch (e: any) {
      toast.error("No se pudieron cargar propiedades", { description: e.message });
    } finally {
      setLoadingProps(false);
    }
  }

  async function handleSave() {
    if (!config) return;
    try {
      await updateConfig.mutateAsync({
        id: config.id,
        enabled,
        auto_sync: autoSync,
        field_mapping: mapping,
      });
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error("Error al guardar", { description: e.message });
    }
  }

  async function handleSyncAll() {
    if (!enabled) {
      toast.error("Activa la integración primero");
      return;
    }
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("hubspot-sync-all");
      if (error) throw error;
      if (data?.ok) {
        toast.success("Sincronización completa", {
          description: `Creados: ${data.created} · Actualizados: ${data.updated} · Omitidos: ${data.skipped} · Errores: ${data.errors}`,
        });
      } else {
        toast.error("Sincronización falló", { description: data?.error });
      }
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    } finally {
      setSyncing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/admin/settings")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Volver a ajustes
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-wide text-foreground mb-1">HubSpot CRM</h1>
        <p className="text-sm text-muted-foreground">
          Sincroniza automáticamente los leads de la plataforma con tu cuenta de HubSpot.
        </p>
      </div>

      {/* Estado de conexión */}
      <Card className="border-white/[0.06] bg-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white/[0.04]">
                <PlugZap size={20} className="text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Estado de conexión</h3>
                {connected === true && (
                  <p className="text-xs text-muted-foreground">
                    Conectado · {accountName}
                  </p>
                )}
                {connected === false && (
                  <p className="text-xs text-destructive">
                    No conectado. Conecta la Service Key desde el panel de Lovable Connectors.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connected === true && (
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 size={12} className="mr-1" /> Activo
                </Badge>
              )}
              {connected === false && (
                <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                  <XCircle size={12} className="mr-1" /> Inactivo
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={testConnection} disabled={testing}>
                {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                <span className="ml-1.5">Probar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración */}
      <Card className="border-white/[0.06] bg-card">
        <CardContent className="p-5 space-y-5">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Workflow size={16} /> Configuración general
          </h3>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div>
              <Label className="text-sm">Integración activa</Label>
              <p className="text-xs text-muted-foreground">
                Permite enviar leads a HubSpot manual o automáticamente.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div>
              <Label className="text-sm">Sincronización automática</Label>
              <p className="text-xs text-muted-foreground">
                Cada nuevo lead se envía a HubSpot al instante.
              </p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} disabled={!enabled} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : (
                <Save size={14} className="mr-1.5" />
              )}
              Guardar configuración
            </Button>
            <Button variant="outline" onClick={handleSyncAll} disabled={syncing || !enabled}>
              {syncing ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <RefreshCw size={14} className="mr-1.5" />}
              Sincronizar todos los leads
            </Button>
            {config?.last_sync_at && (
              <span className="text-xs text-muted-foreground ml-auto">
                Última sincronización: {formatDistanceToNow(new Date(config.last_sync_at), { addSuffix: true, locale: es })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapeo de campos */}
      <Card className="border-white/[0.06] bg-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">Mapeo de campos</h3>
              <p className="text-xs text-muted-foreground">
                Define qué propiedad de HubSpot corresponde a cada campo del lead.
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={loadProperties} disabled={loadingProps}>
              {loadingProps ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span className="ml-1.5">Recargar propiedades</span>
            </Button>
          </div>

          {!connected && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-3">
              Conecta HubSpot para poder asignar propiedades reales.
            </p>
          )}

          <div className="divide-y divide-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden">
            {LEAD_FIELDS.map((field) => (
              <div key={field.key} className="grid grid-cols-2 gap-3 p-3 items-center hover:bg-white/[0.02]">
                <div>
                  <p className="text-sm text-foreground">{field.label}</p>
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
                <Select
                  value={mapping[field.key] || "__none__"}
                  onValueChange={(v) =>
                    setMapping((prev) => ({ ...prev, [field.key]: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecciona propiedad" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="__none__">— No sincronizar —</SelectItem>
                    {properties.length === 0 && mapping[field.key] && (
                      <SelectItem value={mapping[field.key]}>{mapping[field.key]} (actual)</SelectItem>
                    )}
                    {properties.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.label} <span className="text-muted-foreground">({p.name})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card className="border-white/[0.06] bg-card">
        <CardContent className="p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">Historial reciente</h3>
          {!log?.length ? (
            <p className="text-xs text-muted-foreground">Sin sincronizaciones todavía.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {log.map((entry: any) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center gap-2">
                    {entry.action === "error" ? (
                      <XCircle size={12} className="text-destructive" />
                    ) : entry.action === "skip" ? (
                      <XCircle size={12} className="text-muted-foreground" />
                    ) : (
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    )}
                    <span className="text-foreground">{entry.leads?.email || entry.lead_id}</span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {entry.action}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.error_message && (
                      <span className="text-destructive truncate max-w-xs" title={entry.error_message}>
                        {entry.error_message}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.synced_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHubSpot;
