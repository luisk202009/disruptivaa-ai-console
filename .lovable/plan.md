## Objetivo
Permitir que un admin configure el número de WhatsApp y el mensaje predefinido al que apunta el botón flotante (`WhatsAppButton`) visible en el layout público.

## Cambios

### 1. Base de datos (migración)
Nueva tabla `public.site_settings` (singleton tipo key/value para configuración global):
- `key text primary key`
- `value jsonb not null`
- `updated_at timestamptz default now()`
- `updated_by uuid`

Grants + RLS:
- `GRANT SELECT` a `anon` y `authenticated` (para que el botón público lea el número).
- `GRANT ALL` a `service_role`.
- Política SELECT pública: `using (true)`.
- Políticas INSERT/UPDATE solo para `has_role(auth.uid(), 'admin')`.

Seed inicial con `key = 'whatsapp_floating_button'` y `value = { "phone": "", "message": "", "enabled": true }`.

### 2. Página admin
Nueva ruta `/admin/whatsapp-button` (registrada en `App.tsx` dentro del layout admin) y una tarjeta nueva en `src/pages/admin/AdminSettings.tsx` que enlaza a ella.

Formulario con:
- Selector de código de país + input de número (reusando `CountryCodeSelector` de `src/components/whatsapp/`).
- Textarea de mensaje predefinido (opcional, máx. 1000 chars).
- Switch para habilitar/deshabilitar el botón.
- Vista previa del link `https://wa.me/<phone>?text=...` (reusando `buildWaUrl` de `src/lib/walink.ts`).
- Botón Guardar (upsert sobre `site_settings`).

### 3. Hook
`src/hooks/useSiteSetting.ts`: `useSiteSetting(key)` con TanStack Query que devuelve el `value` parseado. Cache 5 min.

### 4. Botón flotante
Actualizar `src/components/landing/WhatsAppButton.tsx`:
- Consumir `useSiteSetting('whatsapp_floating_button')`.
- Si `enabled === false` o `phone` vacío, no renderizar nada.
- Construir `href` con `buildWaUrl(phone, message, 'chat')`.
- Mantener estilos actuales.

## Notas técnicas
- No se modifica el layout público ni otras integraciones de WhatsApp (`whatsapp_links` sigue independiente para los links cortos).
- Todo el texto de UI en español.
- La tabla `site_settings` queda extensible para futuras configuraciones globales (no solo WhatsApp).