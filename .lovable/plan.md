

## Plan: Corregir OAuth y Nombres de Cuentas TikTok

### Diagnóstico

Hay 3 problemas distintos:

1. **Meta OAuth — "URL bloqueada"**: El código usa `window.location.origin` para el redirect URI, lo cual es correcto. Pero en la configuración de tu Meta App (developers.facebook.com), las URIs autorizadas probablemente solo tienen `app.disruptivaa.com`, no `www.disruptivaa.com`.

2. **Google OAuth — "redirect_uri_mismatch"**: Mismo problema. En Google Cloud Console, la URI de redirección autorizada no incluye `https://www.disruptivaa.com/auth/google/callback`.

3. **TikTok OAuth — redirect hardcodeado**: El botón tiene `https://app.disruptivaa.com/auth/tiktok/callback` hardcodeado en el código. Debe cambiarse a `www.disruptivaa.com`.

4. **TikTok — cuentas sin nombre**: El exchange function guarda los advertiser IDs pero nunca consulta sus nombres. El frontend muestra IDs crudos.

---

### Acciones que TÚ debes hacer en las consolas externas

**Meta (developers.facebook.com → tu App → Settings → Basic + Facebook Login → Settings):**
- Agregar `https://www.disruptivaa.com` en "App Domains"
- En "Valid OAuth Redirect URIs" agregar: `https://www.disruptivaa.com/auth/meta/callback`
- Puedes mantener `app.disruptivaa.com` también si lo usas como alias

**Google (console.cloud.google.com → Credentials → tu OAuth Client ID):**
- En "Authorized JavaScript origins" agregar: `https://www.disruptivaa.com`
- En "Authorized redirect URIs" agregar: `https://www.disruptivaa.com/auth/google/callback`

**TikTok (business-api.tiktok.com → tu App):**
- En "Redirect URI" agregar: `https://www.disruptivaa.com/auth/tiktok/callback`

---

### Cambios de código

| Archivo | Cambio |
|---------|--------|
| `src/components/TikTokOAuthButton.tsx` | Cambiar redirect URI hardcodeado de `app.disruptivaa.com` a usar `window.location.origin` (consistente con Meta y Google) |
| `supabase/functions/tiktok-oauth-exchange/index.ts` | Después de obtener el access_token, hacer un fetch a la TikTok API (`/advertiser/info/`) para obtener los nombres reales de cada advertiser_id y guardarlos como `account_names` JSON |
| `src/hooks/useIntegrations.ts` | En `getAccountDetailsByPlatform` para TikTok, usar los nombres guardados en vez de genéricos |

### Detalle del fix de nombres TikTok

En la edge function `tiktok-oauth-exchange`, después de obtener `advertiser_ids`:
1. Hacer GET a `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/` con `advertiser_ids` como parámetro
2. Extraer el `advertiser_name` de cada respuesta
3. Guardar un JSON `account_names` (map de id→nombre) en la columna `account_ids` o en una nueva columna

En `useIntegrations.ts`, leer esos nombres y mostrarlos en el selector de cuentas.

