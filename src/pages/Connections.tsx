import { Link2, ExternalLink, Check, X, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegrations } from "@/hooks/useIntegrations";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PlatformConfig {
  id: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  color: string;
}

const platforms: PlatformConfig[] = [
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    description: 'Conecta tu cuenta de Facebook e Instagram Ads',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
      </svg>
    ),
    color: '#1877F2',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    description: 'Conecta tu cuenta de Google Ads',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="#FBBC04" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
      </svg>
    ),
    color: '#4285F4',
  },
  {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    description: 'Conecta tu cuenta de TikTok Business',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    color: '#000000',
  },
];

const Connections = () => {
  const { user } = useAuth();
  const { getIntegration, connectPlatform, disconnectPlatform, connecting, loading } = useIntegrations();

  const handleConnect = async (platformId: string) => {
    const success = await connectPlatform(platformId);
    if (success) {
      toast.success('Cuenta conectada exitosamente');
    } else {
      toast.error('Error al conectar la cuenta');
    }
  };

  const handleDisconnect = async (platformId: string) => {
    const success = await disconnectPlatform(platformId);
    if (success) {
      toast.success('Cuenta desconectada');
    } else {
      toast.error('Error al desconectar la cuenta');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="text-primary" size={28} />
              <h1 className="text-3xl font-bold text-foreground">Conexiones</h1>
            </div>
            <p className="text-muted-foreground">
              Conecta tus cuentas de publicidad para que nuestros agentes puedan analizar tus métricas y optimizar tus campañas.
            </p>
          </div>

          {/* Cards Grid */}
          {!user ? (
            <div className="glass p-8 rounded-xl text-center">
              <p className="text-muted-foreground">
                Inicia sesión para conectar tus cuentas de publicidad.
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              {platforms.map((platform) => {
                const integration = getIntegration(platform.id);
                const isConnected = integration?.status === 'connected';
                const isConnecting = connecting === platform.id;

                return (
                  <div
                    key={platform.id}
                    className="glass rounded-xl p-6 transition-all duration-300 hover:border-primary/30"
                  >
                    {/* Logo & Name */}
                    <div className="flex items-start gap-4 mb-4">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${platform.color}15` }}
                      >
                        <div style={{ color: platform.color }}>
                          {platform.logo}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {platform.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {isConnected ? integration?.account_name : platform.description}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 mb-5">
                      {isConnected ? (
                        <>
                          <span className="flex items-center gap-1.5 text-sm text-green-500">
                            <Check size={14} />
                            Conectado
                          </span>
                          {integration?.connected_at && (
                            <span className="text-xs text-muted-foreground">
                              · hace {formatDistanceToNow(new Date(integration.connected_at), { locale: es })}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                          No conectado
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    {isConnected ? (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <X size={16} />
                        )}
                        Desconectar
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        style={{ backgroundColor: '#EF7911' }}
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <ExternalLink size={16} />
                        )}
                        {isConnecting ? 'Conectando...' : 'Conectar Cuenta'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Info Note */}
          <div className="mt-8 p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Nota:</strong> Esta es una simulación de conexión. 
              En una implementación real, se utilizaría OAuth para conectar de forma segura con cada plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections;
