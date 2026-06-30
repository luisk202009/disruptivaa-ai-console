## Plan: Integración HubSpot CRM

Sincronización de leads de `app.disruptivaa.com` con HubSpot Contacts usando el **Lovable HubSpot Connector** (gateway). Sin almacenar la Service Key en código: se gestiona desde la UI de Lovable Connectors.

### 1. Conector HubSpot

Usar el connector gateway de Lovable (`HUBSPOT_API_KEY` + `LOVABLE_API_KEY` inyectados automáticamente). El usuario conecta su Service Key (`pat-...`) desde el flujo de connector. Scopes mínimos requeridos en HubSpot:
- `crm.objects.contacts.read`
- `crm.objects.contacts.write`
- `crm.schemas.contacts.read` (para listar propiedades disponibles)

### 2. Modelo de datos

Nueva tabla `hubspot_sync_config` (singleton por instancia, sólo admin):
- `id` uuid PK
- `enabled` boolean (master switch)
- `auto_sync` boolean (sincroniza nuevos leads automáticamente)
- `field_mapping` jsonb — `{ "lead_column": "hubspot_property" }`
- `last_sync_at` timestamptz
- `updated_at` timestamptz

Nueva tabla `hubspot_sync_log` para auditar:
- `id`, `lead_id` (fk leads), `hubspot_contact_id` text, `action` text (create/update/skip/error), `error_message` text, `synced_at` timestamptz

Añadir columna `hubspot_contact_id text` a `leads` para evitar duplicados.

### 3. Mapeo de campos

Campos disponibles en `leads` y su mapeo por defecto a propiedades estándar de HubSpot:

| Campo Lovable | Propiedad HubSpot (default) |
|---|---|
| email | email |
| name | firstname + lastname (split) |
| phone | phone |
| company | company |
| website | website |
| service_type | (custom) `disruptivaa_servicios` |
| niche | (custom) `disruptivaa_nicho` |
| status | lifecyclestage (mapeado) |
| fit_score | (custom) `disruptivaa_fit_score` |
| source | hs_analytics_source |
| notes | (custom) `disruptivaa_notas` |
| created_at | createdate |

El admin puede editar cada mapeo desde la UI mediante selectores poblados con las propiedades reales obtenidas de HubSpot (`GET /crm/v3/properties/contacts`).

### 4. Edge Functions

- `hubspot-list-properties` — GET a `/crm/v3/properties/contacts` para poblar selectores en el frontend (sólo admin).
- `hubspot-sync-lead` — recibe `lead_id`, lee config + lead, hace `POST /crm/v3/objects/contacts` o `PATCH` según `hubspot_contact_id`. Registra resultado en `hubspot_sync_log`.
- `hubspot-sync-all` — itera todos los leads y los sincroniza (acción manual "Sincronizar todo").
- `hubspot-test-connection` — verifica que la conexión funciona (llama `/account-info/v3/details`).

Todas usan `verify_jwt=true` y `has_role(admin)`. La sincronización automática se dispara con un trigger en Postgres → `pg_net` que invoca `hubspot-sync-lead` cuando se inserta/actualiza un lead (sólo si `auto_sync=true`).

### 5. UI Admin

**`/admin/settings`** — añadir tarjeta "HubSpot CRM" (con icono Building2/Workflow).

**`/admin/hubspot`** — nueva página con tres secciones:
1. **Estado de conexión**: badge (conectado / no conectado), botón "Probar conexión", botón "Conectar/Reconectar" que abre el flujo del Lovable Connector.
2. **Configuración**: switches `enabled` y `auto_sync`. Botón "Sincronizar todos los leads ahora" con barra de progreso.
3. **Mapeo de campos**: tabla con una fila por cada campo de `leads`. Cada fila tiene un `Select` con las propiedades de HubSpot disponibles + opción "No sincronizar". Auto-detección inicial sugerida.
4. **Historial**: últimos 50 registros de `hubspot_sync_log` con estado y mensajes de error.

### 6. Detalles técnicos

- **Endpoint gateway**: `https://connector-gateway.lovable.dev/hubspot/{path}` con headers `Authorization: Bearer ${LOVABLE_API_KEY}` y `X-Connection-Api-Key: ${HUBSPOT_API_KEY}`.
- **Idempotencia**: si `hubspot_contact_id` existe → `PATCH`, si no → buscar por email vía `/crm/v3/objects/contacts/{email}?idProperty=email` antes de crear.
- **Manejo de errores**: errores `MISSING_SCOPES` muestran un aviso explicando que la Service Key necesita regenerarse con scopes adicionales. 429 → backoff con reintento simple.
- **Privacidad**: los logs no almacenan tokens; el `hubspot_contact_id` no es sensible.
- **Idioma**: toda la UI y comentarios en español.

### Archivos a crear/editar

- Migración: nuevas tablas + columna + trigger + GRANTs + RLS (admin-only).
- `supabase/functions/hubspot-list-properties/index.ts`
- `supabase/functions/hubspot-sync-lead/index.ts`
- `supabase/functions/hubspot-sync-all/index.ts`
- `supabase/functions/hubspot-test-connection/index.ts`
- `src/pages/admin/AdminHubSpot.tsx`
- `src/components/admin/HubSpotFieldMapper.tsx`
- `src/components/admin/HubSpotSyncLog.tsx`
- `src/hooks/useHubSpotConfig.ts`
- Editar `src/pages/admin/AdminSettings.tsx` (añadir tarjeta) y `src/App.tsx` (ruta).
