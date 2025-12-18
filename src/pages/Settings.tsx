import { Settings as SettingsIcon, User, Bell, Palette, Shield } from "lucide-react";
import Sidebar from "@/components/Sidebar";

const Settings = () => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-6 bg-background overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="text-primary" size={28} />
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <User className="text-muted-foreground" size={20} />
                <div>
                  <h3 className="font-medium text-foreground">Perfil</h3>
                  <p className="text-sm text-muted-foreground">Gestiona tu información personal</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="text-muted-foreground" size={20} />
                <div>
                  <h3 className="font-medium text-foreground">Notificaciones</h3>
                  <p className="text-sm text-muted-foreground">Configura tus preferencias de alertas</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Palette className="text-muted-foreground" size={20} />
                <div>
                  <h3 className="font-medium text-foreground">Apariencia</h3>
                  <p className="text-sm text-muted-foreground">Personaliza el tema de la aplicación</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Shield className="text-muted-foreground" size={20} />
                <div>
                  <h3 className="font-medium text-foreground">Seguridad</h3>
                  <p className="text-sm text-muted-foreground">Contraseña y autenticación</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
