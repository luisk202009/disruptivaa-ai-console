

## Plan: Migrar URLs cortas de WhatsApp al dominio propio

### Resumen
Cambiar el dominio de los enlaces cortos de `qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/wa-redirect/{slug}` a `www.disruptivaa.com/wa/{slug}`, agregando una página intermedia que ejecute el redirect vía la Edge Function existente.

### Cambios

**1. `src/lib/walink.ts`** — Agregar `WA_SHORT_BASE_URL = 'https://www.disruptivaa.com/wa'` y actualizar `buildShortLink` para usarlo. Mantener `WA_REDIRECT_BASE_URL` (lo usa la nueva página para llamar a la Edge Function).

**2. `src/pages/WaRedirect.tsx`** (nuevo) — Componente standalone (sin layout) que:
- Lee `:slug` con `useParams`
- En `useEffect` ejecuta `window.location.replace('https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/wa-redirect/{slug}')` para que el navegador siga el 302 hacia `wa.me` y la Edge Function registre el click
- Muestra pantalla de carga: fondo blanco, ícono WhatsApp (Lucide `MessageCircle` color `#25D366`), texto "Redirigiendo..." y spinner sutil
- Estado de error con botón a `https://www.disruptivaa.com/whatsapp-link` (timeout de seguridad de 5s)

> Nota técnica: usar `window.location.replace` (no `fetch`) porque la Edge Function responde con `302 Location: https://wa.me/...` y `fetch` no abre WhatsApp. La redirección del navegador sí dispara el insert de click en la función y luego sigue al destino final.

**3. `src/App.tsx`** — Agregar ruta pública `/wa/:slug` con lazy loading, ubicada antes del catch-all `*`. No usa `ProtectedRoute` ni `PublicLayout`.

**4. `src/components/whatsapp/WhatsAppLinkForm.tsx`** — Cambiar el prefix visual del campo slug de la URL de Supabase a `www.disruptivaa.com/wa/`.

### Archivos
| Archivo | Acción |
|---|---|
| `src/lib/walink.ts` | Modificar |
| `src/pages/WaRedirect.tsx` | Crear |
| `src/App.tsx` | Modificar (nueva ruta) |
| `src/components/whatsapp/WhatsAppLinkForm.tsx` | Modificar (prefix) |

### Propagación automática
Todos los consumidores (`WhatsAppLinkGenerator`, `WhatsAppLinksPage`, `WhatsAppQRModal`, `WhatsAppLinkAnalytics`, QR codes) ya usan `buildShortLink(slug)` → reflejan el cambio sin tocarlos.

