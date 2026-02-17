
# Sprint 7 - Tarea 5: Central de Notificaciones

## Resumen

Crear un sistema completo de notificaciones con tabla en Supabase, gestion desde el Admin Dashboard y un centro de notificaciones para los usuarios con badge de no leidos y funcion "marcar como leido".

## Cambios

### 1. Migracion de Base de Datos: Tabla `notifications`

Crear tabla con los siguientes campos:

| Columna | Tipo | Default | Nullable |
|---------|------|---------|----------|
| id | uuid | gen_random_uuid() | No |
| company_id | uuid (FK companies) | NULL | Si (null = global) |
| title | text | - | No |
| message | text | - | No |
| type | text | 'info' | No |
| read_by | uuid[] | '{}' | No |
| created_at | timestamptz | now() | Yes |

Politicas RLS:
- **Admins**: ALL (usando `has_role()`)
- **Users SELECT**: notificaciones donde `company_id` es NULL (globales) O donde `company_id` coincide con su `profiles.company_id`

### 2. Hook `useNotifications.ts` (Nuevo)

- Consulta notificaciones visibles para el usuario (globales + de su empresa)
- Calcula `unreadCount` filtrando las que NO contienen `auth.uid()` en `read_by`
- Expone funcion `markAsRead(notificationId)` que hace un UPDATE al array `read_by` usando `array_append`
- Devuelve `{ notifications, unreadCount, isLoading, markAsRead }`

Se necesita una funcion SQL `mark_notification_read` (security definer) que haga el `array_append` sin exponer UPDATE directo a los usuarios.

### 3. Admin Dashboard - Pestana "Notificaciones"

Agregar una cuarta pestana en `AdminDashboard.tsx`:

**Formulario de envio**:
- Input: Titulo
- Textarea: Cuerpo del mensaje
- Select: Tipo (info, warning, success, error)
- Select: Empresa destino (lista de companies + opcion "Todas las empresas" con valor NULL)
- Boton "Enviar Notificacion"

**Tabla de notificaciones enviadas** (debajo del formulario):
- Columnas: Titulo, Tipo (badge con color), Destino (empresa o "Global"), Fecha
- Boton eliminar por fila

Badges de tipo con colores:
- `info` -> azul (border-blue-500/30, text-blue-400)
- `warning` -> amarillo (border-amber-500/30, text-amber-400)
- `success` -> verde (border-green-500/30, text-green-400)
- `error` -> rojo (border-red-500/30, text-red-400)

### 4. Centro de Notificaciones en Sidebar

Agregar un icono `Bell` en la seccion de navegacion del Sidebar (antes del footer, despues de "Ecosistema Digital"):

- Icono con badge rojo que muestra `unreadCount` cuando > 0
- Al hacer click, abre un `Popover` con la lista de notificaciones
- Cada notificacion muestra: tipo (icono/color), titulo, mensaje truncado, fecha relativa
- Boton "Marcar como leida" por notificacion (o click para marcar)
- Maximo 20 notificaciones, ordenadas por fecha desc
- Notificaciones de tipo `info` usan el color dinamico de la empresa

### 5. Componente `NotificationCenter.tsx` (Nuevo)

Componente independiente que encapsula:
- El icono Bell con badge
- El Popover con la lista
- La logica de marcar como leido
- Importado por `Sidebar.tsx`

### 6. Traducciones

Agregar claves en los 3 idiomas:

```text
notifications.title = "Notificaciones" / "Notifications" / "Notificacoes"
notifications.noNotifications = "No hay notificaciones" / "No notifications" / "Sem notificacoes"
notifications.markRead = "Marcar como leida" / "Mark as read" / "Marcar como lida"
notifications.sendNotification = "Enviar Notificacion" / "Send Notification" / "Enviar Notificacao"
notifications.allCompanies = "Todas las Empresas" / "All Companies" / "Todas as Empresas"
notifications.notifTitle = "Titulo" / "Title" / "Titulo"
notifications.notifBody = "Mensaje" / "Message" / "Mensagem"
notifications.notifType = "Tipo" / "Type" / "Tipo"
notifications.destination = "Destino" / "Destination" / "Destino"
notifications.global = "Global"
notifications.sent = "Notificacion enviada" / "Notification sent" / "Notificacao enviada"
admin.notifications = "Notificaciones" / "Notifications" / "Notificacoes"
```

## Seccion Tecnica

### Funcion SQL `mark_notification_read`

Se necesita una funcion `security definer` para que los usuarios puedan agregar su UUID al array `read_by` sin tener permiso UPDATE general:

```sql
CREATE OR REPLACE FUNCTION public.mark_notification_read(_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET read_by = array_append(read_by, auth.uid())
  WHERE id = _notification_id
    AND NOT (read_by @> ARRAY[auth.uid()]);
END;
$$;
```

### Flujo de datos

```text
Admin crea notificacion -> INSERT en notifications (company_id o NULL)
                        -> RLS permite SELECT a usuarios de esa empresa o global
                        -> useNotifications consulta y filtra unread
                        -> Badge en Sidebar muestra conteo
                        -> Usuario abre Popover, ve lista
                        -> Click "marcar leida" -> llama mark_notification_read()
                        -> read_by se actualiza -> unreadCount baja
```

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| Nueva migracion SQL | Crear tabla `notifications`, funcion `mark_notification_read`, RLS |
| `src/hooks/useNotifications.ts` | Nuevo: hook para consultar y gestionar notificaciones |
| `src/components/NotificationCenter.tsx` | Nuevo: icono Bell + Popover con lista de notificaciones |
| `src/pages/AdminDashboard.tsx` | Agregar pestana "Notificaciones" con formulario y tabla |
| `src/components/Sidebar.tsx` | Importar y renderizar `NotificationCenter` |
| `src/i18n/locales/es/common.json` | Agregar traducciones |
| `src/i18n/locales/en/common.json` | Agregar traducciones |
| `src/i18n/locales/pt/common.json` | Agregar traducciones |
