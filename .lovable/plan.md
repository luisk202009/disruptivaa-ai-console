## Plan: Mejoras al CRUD de leads

### 1. Base de datos
Migración para añadir columna `website` (text, nullable) a `public.leads`.

### 2. Catálogo de servicios
Crear `src/lib/leadServices.ts` con las opciones:
- `crm-hubspot` — CRM HubSpot
- `negocio-14-dias` — Negocio Digital en 14 días
- `shopify` — Shopify
- `marketing-ads` — Marketing & Ads
- `websites-landings` — Websites & Landings
- `mvp-aplicaciones` — MVP & Aplicaciones

El campo `service_type` en la BD pasa a almacenar una lista separada por comas (compatible con el texto libre existente). Helpers `parseServices` / `serializeServices` para convertir entre string y array.

### 3. `ManualLeadDialog.tsx`
- Reemplazar el `Input` de "Servicio de interés" por un selector múltiple (popover con checkboxes usando los componentes shadcn existentes: `Popover` + `Command` o lista de `Checkbox`).
- Añadir nuevo campo "Sitio web" (`Input` tipo url, opcional, con validación básica y normalización a `https://` si falta protocolo).
- Persistir `website` y `service_type` (CSV) en el insert.

### 4. `LeadDialog.tsx` (ver / editar)
- **Modo ver**: mostrar el sitio web como enlace clickable (`<a target="_blank" rel="noopener noreferrer">`) con icono `ExternalLink`. Mostrar los servicios como chips/badges.
- **Modo editar**: mismo selector múltiple de servicios e input de sitio web que en el manual.
- Actualizar el `update` para incluir ambos campos.

### 5. `AdminLeads.tsx`
- Incluir `website` en el tipo `LeadRecord` que se pasa al diálogo.
- (Opcional) pequeño icono de globo junto al nombre si el lead tiene web, que abre el sitio en nueva pestaña.

### Detalles técnicos
- No se cambia la firma de `service_type` en BD (sigue siendo `text`), evitando migración destructiva. El array se serializa con `", "`.
- La normalización de URL acepta `dominio.com`, `www.dominio.com` y URLs completas; se valida con `URL()` tras prefijar `https://` si es necesario.
- Todos los textos y comentarios en español.
