

# Correccion de Conexion TikTok Ads OAuth

## Problema

El error "app_id: value is required but missing" ocurre porque `VITE_TIKTOK_APP_ID` no esta configurado y el boton envia un `app_id` vacio a TikTok. Ademas, la reconexion de Supabase borro todas las configuraciones de Edge Functions del `config.toml`.

## Cambios

### 1. TikTokOAuthButton.tsx - Hardcodear App ID y validacion

**Archivo**: `src/components/TikTokOAuthButton.tsx`

- Hardcodear el App ID `7607279938378399760` (es un identificador publico, igual que `META_APP_ID` ya hardcodeado en `MetaOAuthButton.tsx`)
- Usar URL de produccion para el redirect: `https://app.disruptivaa.com/auth/tiktok/callback`
- Agregar validacion: si por alguna razon el App ID esta vacio, mostrar error con `toast` en vez de redirigir a TikTok con URL rota

### 2. Restaurar supabase/config.toml

**Archivo**: `supabase/config.toml`

La reconexion anterior borro todas las configuraciones de Edge Functions. Se restauran las 12 funciones con `verify_jwt = false`:

- fetch-meta-metrics
- fetch-meta-accounts
- disruptivaa-agent
- meta-oauth-exchange
- google-oauth-exchange
- validate-meta-connection
- fetch-google-ads-metrics
- fetch-tiktok-ads-metrics
- tiktok-oauth-exchange
- send-branded-email
- stripe-webhook
- generate-landing

Sin esta restauracion, TODAS las Edge Functions fallarian al recibir requests.

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/TikTokOAuthButton.tsx` | Hardcode App ID, URL produccion, validacion |
| `supabase/config.toml` | Restaurar configuracion de 12 Edge Functions |

## Paso Manual Requerido

Asegurate de que la URL `https://app.disruptivaa.com/auth/tiktok/callback` este registrada como callback permitido en la configuracion de tu app en el portal de TikTok for Business.

