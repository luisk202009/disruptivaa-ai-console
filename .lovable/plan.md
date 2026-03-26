

# Admin Layout dedicado con sidebar propio

## Problema actual
El admin usa el Sidebar principal de la app y las secciones (Empresas, Usuarios, Suscripciones, etc.) están como tabs dentro de una sola página `AdminDashboard.tsx` (1012 líneas). Leads CRM aparece como opción en el sidebar principal mezclado con las opciones de usuario.

## Solución

### 1. Crear `AdminLayout` component
Nuevo componente `src/components/admin/AdminLayout.tsx` con:
- Sidebar propio con el mismo estilo visual del Sidebar principal (fondo oscuro, iconos, hover states)
- 6 items de navegación: Leads CRM, Empresas, Usuarios, Suscripciones, Notificaciones, Email
- Botón "Volver a la app" en la parte superior que navega a `/dashboard`
- Logo de Disruptivaa en el header
- Collapsible como el sidebar principal

### 2. Separar tabs en páginas individuales
Extraer cada tab de `AdminDashboard.tsx` (1012 líneas) en páginas independientes:
- `/admin` → redirect o landing (Leads CRM por defecto)
- `/admin/leads` → `AdminLeads.tsx` (ya existe)
- `/admin/companies` → nuevo `AdminCompanies.tsx`
- `/admin/users` → nuevo `AdminUsers.tsx`
- `/admin/subscriptions` → nuevo `AdminSubscriptions.tsx`
- `/admin/notifications` → nuevo `AdminNotifications.tsx`
- `/admin/emails` → nuevo `AdminEmails.tsx`

Cada página usará `AdminLayout` como wrapper en lugar de `Sidebar`.

### 3. Actualizar rutas en `App.tsx`
Agregar las nuevas rutas `/admin/*` envueltas en `ProtectedRoute` + `AdminLayout`.

### 4. Limpiar Sidebar principal
- Quitar "Leads CRM" del sidebar principal
- Mantener solo el acceso "Admin" en el dropdown del perfil (que navega a `/admin`)

## Archivos

| Archivo | Cambio |
|---|---|
| `src/components/admin/AdminLayout.tsx` | **Nuevo**: layout con sidebar admin |
| `src/pages/admin/AdminCompanies.tsx` | **Nuevo**: extraído del tab companies |
| `src/pages/admin/AdminUsers.tsx` | **Nuevo**: extraído del tab users |
| `src/pages/admin/AdminSubscriptions.tsx` | **Nuevo**: extraído del tab subscriptions |
| `src/pages/admin/AdminNotifications.tsx` | **Nuevo**: extraído del tab notifications |
| `src/pages/admin/AdminEmails.tsx` | **Nuevo**: extraído del tab emails |
| `src/pages/AdminDashboard.tsx` | Simplificar: redirect a `/admin/leads` |
| `src/App.tsx` | Agregar rutas `/admin/*` |
| `src/components/Sidebar.tsx` | Quitar Leads CRM del admin section |

