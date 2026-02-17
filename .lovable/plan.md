
# Plan: Admin Dashboard — Gestión de Empresas y Sitios Web

## Resumen

Crear una página exclusiva para administradores que muestre todas las empresas registradas y permita gestionar sus sitios web (URLs), con acceso controlado por `profile.role === 'admin'` y diseño minimalista con Electric Blue (#00A3FF).

---

## Cambios Detallados

### 1. Actualizar `src/hooks/useUserProfile.ts`

Agregar los campos `role` y `company_id` al tipo `UserProfile` para que el rol del perfil sea accesible en toda la app.

```typescript
export interface UserProfile {
  id: string;
  language: SupportedLanguage;
  role: string | null;       // NUEVO
  company_id: string | null; // NUEVO
  created_at: string;
  updated_at: string;
}
```

### 2. Crear `src/pages/AdminDashboard.tsx`

Pagina protegida que:
- Verifica `profile.role === 'admin'`, redirige a `/` si no es admin
- Usa `useQuery` para fetch de `companies` (tabla existente con RLS para admins)
- Muestra tabla minimalista con nombre, color de branding, y boton "Gestionar Sitios"
- Boton abre un Dialog (Shadcn) que:
  - Lista URLs actuales de `company_websites` (con badge de tipo y link externo)
  - Formulario para agregar nueva URL con Select de tipo (Landing/Website/Ecommerce)
  - Boton de guardado con color Electric Blue (#00A3FF)
  - Boton de eliminar URL por sitio
- Layout: Sidebar + main content con `font-['Fira_Sans',sans-serif]`
- Background: hereda el `--background` del tema (negro profundo)

### 3. Actualizar `src/components/Sidebar.tsx`

- Importar `ShieldCheck` de lucide-react
- Importar `useUserProfile` hook
- En la seccion de navegacion (`navItems`), agregar condicionalmente un item "Panel Admin" con icono ShieldCheck cuando `profile?.role === 'admin'`
- Posicion: despues de "Agentes AI" (ultimo item de navegacion)

Cambio especifico en linea ~190:
```typescript
const { profile } = useUserProfile();

const navItems = [
  { id: "dashboard", icon: <LayoutDashboard .../>, label: t("navigation.dashboard"), path: "/" },
  { id: "panels", icon: <LayoutGrid .../>, label: t("navigation.panels"), path: "/dashboards" },
  { id: "agents", icon: <Bot .../>, label: t("navigation.agents"), path: "/agents" },
  // Condicional: solo si es admin
  ...(profile?.role === "admin" ? [
    { id: "admin", icon: <ShieldCheck size={18} strokeWidth={1.5} />, label: t("navigation.admin"), path: "/admin" }
  ] : []),
];
```

Actualizar `getActiveItem()` para reconocer `/admin`.

### 4. Actualizar `src/App.tsx`

Agregar ruta `/admin`:
```typescript
import AdminDashboard from "./pages/AdminDashboard";

<Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

### 5. Traducciones (i18n)

Agregar claves en los 3 archivos de idioma:

**Espanol (es/common.json):**
```json
"navigation": {
  "admin": "Panel Admin"
},
"admin": {
  "title": "Panel de Administración",
  "subtitle": "Gestiona empresas y sus sitios web",
  "companyName": "Empresa",
  "color": "Color",
  "actions": "Acciones",
  "manageSites": "Gestionar Sitios",
  "sites": "Sitios Web",
  "noCompanies": "No hay empresas registradas.",
  "noWebsites": "No hay sitios web registrados.",
  "addWebsite": "Agregar sitio web",
  "addSite": "Agregar Sitio",
  "type": "Tipo",
  "websiteAdded": "Sitio web agregado correctamente",
  "websiteDeleted": "Sitio web eliminado",
  "websiteError": "Error al procesar la solicitud"
}
```

**Ingles (en/common.json):**
```json
"navigation": {
  "admin": "Admin Panel"
},
"admin": {
  "title": "Admin Panel",
  "subtitle": "Manage companies and their websites",
  "companyName": "Company",
  "color": "Color",
  "actions": "Actions",
  "manageSites": "Manage Sites",
  "sites": "Websites",
  "noCompanies": "No companies registered.",
  "noWebsites": "No websites registered.",
  "addWebsite": "Add website",
  "addSite": "Add Site",
  "type": "Type",
  "websiteAdded": "Website added successfully",
  "websiteDeleted": "Website deleted",
  "websiteError": "Error processing the request"
}
```

**Portugues (pt/common.json):**
```json
"navigation": {
  "admin": "Painel Admin"
},
"admin": {
  "title": "Painel de Administração",
  "subtitle": "Gerencie empresas e seus sites",
  "companyName": "Empresa",
  "color": "Cor",
  "actions": "Ações",
  "manageSites": "Gerenciar Sites",
  "sites": "Sites",
  "noCompanies": "Nenhuma empresa registrada.",
  "noWebsites": "Nenhum site registrado.",
  "addWebsite": "Adicionar site",
  "addSite": "Adicionar Site",
  "type": "Tipo",
  "websiteAdded": "Site adicionado com sucesso",
  "websiteDeleted": "Site removido",
  "websiteError": "Erro ao processar a solicitação"
}
```

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/pages/AdminDashboard.tsx` | **Crear** | Pagina admin con tabla de empresas y dialog de sitios |
| `src/hooks/useUserProfile.ts` | **Modificar** | Agregar `role` y `company_id` al tipo |
| `src/components/Sidebar.tsx` | **Modificar** | Agregar link "Panel Admin" condicional |
| `src/App.tsx` | **Modificar** | Agregar ruta `/admin` |
| `src/i18n/locales/es/common.json` | **Modificar** | Agregar claves `admin.*` y `navigation.admin` |
| `src/i18n/locales/en/common.json` | **Modificar** | Agregar claves `admin.*` y `navigation.admin` |
| `src/i18n/locales/pt/common.json` | **Modificar** | Agregar claves `admin.*` y `navigation.admin` |

---

## Seguridad

- La pagina redirige a `/` si el perfil no tiene `role === 'admin'`
- Las tablas `companies` y `company_websites` ya tienen RLS configurado para admins
- El check de rol se hace server-side via la columna `role` en `profiles` (ya existente en DB)
- La ruta esta protegida por `ProtectedRoute` (requiere autenticacion) + check de rol adicional en el componente

## Verificacion Post-Implementacion

- [ ] Solo usuarios con `role = 'admin'` ven el link "Panel Admin" en el sidebar
- [ ] Al acceder `/admin` sin ser admin, redirige a `/`
- [ ] La tabla de empresas carga correctamente
- [ ] El dialog muestra y permite agregar/eliminar URLs
- [ ] El boton de guardado usa Electric Blue (#00A3FF)
- [ ] Las traducciones funcionan en ES, EN y PT
