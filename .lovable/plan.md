

## Plan: Módulo WhatsApp Link Generator

### Resumen

Implementar un módulo completo con dos contextos: herramienta pública en `/whatsapp-link` y módulo autenticado en `/dashboard/ecosistema/whatsapp-links`. Las tablas Supabase ya existen (`whatsapp_links`, `whatsapp_link_clicks`), la vista `whatsapp_link_analytics` y la RPC `check_slug_available` también.

### Verificaciones previas necesarias

- Confirmar que existe la vista `whatsapp_link_analytics` en Supabase (revisar schema actual indica que no aparece en `<supabase-tables>`, solo las dos tablas base — habrá que crearla si falta)
- Instalar `qrcode.react` (no está en el proyecto actual)
- La Edge Function `wa-redirect` no existe aún — habrá que crearla para que los links cortos funcionen y registren clics

### Archivos a crear

| Archivo | Propósito |
|---|---|
| `src/lib/walink.ts` | Helpers de URLs y generación de slug (contenido exacto del prompt) |
| `src/lib/countryCodes.ts` | Lista de países con bandera + código (Colombia +57 default) |
| `src/hooks/useWhatsAppLinks.ts` | CRUD + queries con React Query sobre `whatsapp_links` y vista analytics |
| `src/components/whatsapp/CountryCodeSelector.tsx` | Dropdown con banderas |
| `src/components/whatsapp/WhatsAppPhonePreview.tsx` | Mockup móvil del chat |
| `src/components/whatsapp/WhatsAppQRCode.tsx` | QR con color #25D366, descarga PNG/SVG, logo opcional |
| `src/components/whatsapp/WhatsAppQRModal.tsx` | Modal envoltorio con descargas |
| `src/components/whatsapp/WhatsAppLinkForm.tsx` | Formulario reutilizable crear/editar con validación de slug |
| `src/pages/WhatsAppLinkGenerator.tsx` | Página pública `/whatsapp-link` |
| `src/pages/dashboard/WhatsAppLinksPage.tsx` | Listado autenticado |
| `src/pages/dashboard/WhatsAppLinkNew.tsx` | Wrapper crear |
| `src/pages/dashboard/WhatsAppLinkEdit.tsx` | Wrapper editar |
| `src/pages/dashboard/WhatsAppLinkAnalytics.tsx` | Vista analítica con gráfico recharts |
| `supabase/functions/wa-redirect/index.ts` | Edge Function: lee slug de URL, registra click en `whatsapp_link_clicks`, redirige a `wa.me/...` |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Agregar ruta pública `/whatsapp-link` y rutas protegidas bajo `/dashboard/ecosistema/whatsapp-links/*` |
| `src/components/Sidebar.tsx` | Agregar sección "Ecosistema Digital" → "WhatsApp Links" |
| `src/components/landing/Navbar.tsx` | (Opcional) Link a herramienta pública en sección Herramientas |
| `supabase/config.toml` | Registrar `wa-redirect` con `verify_jwt = false` |
| `package.json` | Añadir dependencia `qrcode.react` |

### Cambios en base de datos (migración)

1. **Crear vista `whatsapp_link_analytics`** (si no existe): join de `whatsapp_links` con conteo de `whatsapp_link_clicks` (total + únicos por `ip_hash` + último click). Vista con `security_invoker` para respetar RLS de origen.
2. **Permitir INSERT público en `whatsapp_link_clicks`** (actualmente bloqueado): política que permita a `anon` y `authenticated` insertar (lo hará la edge function con service role, pero por seguridad limitar a inserts vía service role o desde la función misma — usar service role en la edge function evita necesidad de policy adicional).
3. **Permitir INSERT con `user_id = null` en `whatsapp_links`**: las políticas actuales requieren `auth.uid() = user_id`. Añadir política que permita a `anon` insertar links anónimos (`user_id IS NULL`), y restringir UPDATE/DELETE de esos links.

### Flujo de la Edge Function `wa-redirect`

```text
GET /wa-redirect/{slug}
  ↓
SELECT phone, message, link_type, is_active FROM whatsapp_links WHERE slug=?
  ↓
si no existe o inactivo → 404
  ↓
INSERT en whatsapp_link_clicks (link_id, referrer, device_type desde UA, ip_hash desde SHA256(IP))
  ↓
302 redirect a buildWaUrl(phone, message, link_type)
```

### Detalles UI clave

- **Página pública**: 2 columnas desktop (form izq | preview móvil der), banner inferior con CTA a registro
- **Validación slug**: debounce 500ms, RPC `check_slug_available`, indicador visual verde/rojo
- **Toggle activo/inactivo**: optimistic update con React Query
- **QR**: usar `qrcode.react` con `value={buildShortLink(slug)}`, `fgColor="#25D366"`, descargas convirtiendo canvas/svg a blob
- **Gráfico analítica**: recharts `LineChart` agrupado por día (procesado en cliente desde los clicks crudos)
- **Eliminación**: `AlertDialog` de confirmación
- **Skeletons**: en tabla, analítica y formulario de edición durante carga

### Consideraciones de seguridad

- Edge function usa service role para insert de clicks (sin exponer policies públicas)
- Hash de IP con SHA-256 antes de almacenar (privacy)
- Links anónimos (`user_id IS NULL`) son inmutables tras creación
- Validación cliente + servidor (zod) en el formulario

