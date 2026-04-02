

## Plan: Reorganizar menú admin + mejoras en vista de usuarios

### Cambios en el sidebar (`AdminLayout.tsx`)

Reorganizar los nav items en 3 secciones con labels:

**Administración**
- Empresas (`/admin/companies`)
- Usuarios (`/admin/users`)
- Suscripciones (`/admin/subscriptions`)

**CRM**
- Leads (`/admin/leads`)
- Propuestas (`/admin/proposals`)

**Ajustes**
- Tarjeta que lleva a `/admin/settings` — página nueva con vista de tarjetas para:
  - Email (enlaza a `/admin/emails`)
  - Plantillas de Propuestas (enlaza a `/admin/proposal-templates`)

**Al final (sin sección)**
- Notificaciones (`/admin/notifications`)

### Nueva página: `AdminSettings.tsx`

Página en `/admin/settings` que muestra tarjetas (cards) para cada sub-sección de ajustes:
- **Email**: icono Mail, descripción "Configura plantillas de correo", enlace a `/admin/emails`
- **Plantillas de Propuestas**: icono Code, descripción "Edita las plantillas HTML de propuestas", enlace a `/admin/proposal-templates`

Cada tarjeta es clickeable y navega a su página correspondiente (que ya existe).

### Mejoras en `AdminUsers.tsx`

Agregar dos columnas a la tabla:
- **Email**: Se obtiene consultando `auth.users` vía `supabase.auth.admin.listUsers()` — pero como no tenemos acceso admin desde el cliente, usaremos el campo `id` para buscar el email. Alternativa más viable: crear una edge function o usar un approach diferente.

Dado que no hay acceso a `auth.users` desde el cliente, la solución será:
- Agregar el email al `profiles` table vía un trigger que ya podría existir, o crear una columna `email` en profiles sincronizada.
- **Solución más simple**: Usar `supabase.rpc` o consultar directamente si existe un campo email. Revisaré si hay forma de obtener emails sin modificar la DB.

**Approach final para emails**: Crear una migración que agregue una columna `email` a `profiles` y un trigger que la sincronice desde `auth.users` al crear/actualizar perfil.

- **Onboarding completado**: Mostrar un badge/indicador basado en si `company_id` es NOT NULL (= onboarding completado).

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/components/admin/AdminLayout.tsx` | Reorganizar nav en 3 secciones + Ajustes + Notificaciones al final |
| `src/pages/admin/AdminSettings.tsx` | Nueva página con tarjetas para Email y Plantillas |
| `src/pages/admin/AdminUsers.tsx` | Agregar columnas email y estado de onboarding |
| `src/App.tsx` | Agregar ruta `/admin/settings` |
| Migración SQL | Agregar columna `email` a `profiles` + trigger de sincronización desde `auth.users` |

