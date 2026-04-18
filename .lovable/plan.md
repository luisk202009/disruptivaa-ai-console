

## Diagnóstico: la ruta ya existe — el 404 viene de otro lado

### Estado actual verificado en `src/App.tsx`

```tsx
// Línea 58 — import lazy
const WaRedirect = lazy(() => import("./pages/WaRedirect"));

// Línea 119 — ruta pública, antes del catch-all
<Route path="/wa/:slug" element={<Lazy><WaRedirect /></Lazy>} />

// Línea 156 — catch-all al final
<Route path="*" element={<NotFound />} />
```

La ruta **sí está registrada correctamente**: es pública, lazy-loaded, sin `ProtectedRoute`, y precede al catch-all. No hay nada que modificar en el router.

### Entonces, ¿por qué ves un 404?

El 404 que estás viendo casi seguro **no proviene de React Router**, sino de uno de estos dos puntos:

**Causa más probable — La Edge Function `wa-redirect` devuelve 404**

El flujo real es:
```text
www.disruptivaa.com/wa/{slug}    ← React Router monta WaRedirect ✓
        ↓ window.location.replace
qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/wa-redirect/{slug}
        ↓
Edge Function busca el slug en whatsapp_links
        ↓
Si no existe / inactivo → 404 (mostrado por el navegador, no por la app)
```

Si pruebas con un slug que no creaste en la base de datos, verás el 404 de Supabase, no el de React Router.

**Causa secundaria — Dominio custom en producción**

`window.location.replace` te saca de la SPA y te lleva al dominio de Supabase. Si vienes de `www.disruptivaa.com/wa/abc`, eso funciona. Pero si el slug no existe, terminas en una URL `*.supabase.co/...` con 404.

### Plan de verificación (sin tocar el router)

1. **Confirmar el slug existe**: abrir la lista en `/dashboard/ecosistema/whatsapp-links` y copiar un slug real activo.
2. **Probar la ruta SPA aislada**: visitar `/wa/{slug-real}` — debería mostrar la pantalla "Redirigiendo..." un instante.
3. **Probar la Edge Function directa**: `curl -I https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/wa-redirect/{slug-real}` — debe devolver `302 Location: https://wa.me/...`.
4. **Si la Edge Function devuelve 404**: revisar logs de la función `wa-redirect` para confirmar que está leyendo bien el slug (puede haber bug en el parseo de path o en la query a `whatsapp_links`).

### Acciones propuestas (solo si el diagnóstico lo confirma)

| Escenario | Acción |
|---|---|
| Edge Function devuelve 404 con slug válido | Revisar y corregir `supabase/functions/wa-redirect/index.ts` |
| Slug no existe en BD | Crear uno desde la UI y reprobar |
| 404 viene de React Router (improbable) | Compartir la URL exacta para investigar |

### Pregunta clave antes de modificar código

¿Puedes confirmar **con qué URL exacta** ves el 404? Por ejemplo:
- `https://www.disruptivaa.com/wa/abc123` (404 de la SPA → bug del router)
- `https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/wa-redirect/abc123` (404 de Supabase → bug en la edge function o slug inexistente)

Con ese dato puedo diagnosticar la causa real y proponer el fix correcto en lugar de tocar el router que ya está bien configurado.

