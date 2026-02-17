
# Migracion de TikTok Demo a Conexion Real

## Resumen

Eliminar el modo demo de TikTok Ads e implementar el flujo OAuth real completo: edge function de intercambio de tokens, pagina de callback, datos reales en el dashboard, e integracion con Smart Alerts.

## Prerequisitos

Antes de implementar, necesitas obtener las credenciales de tu aplicacion TikTok for Business:

- **TIKTOK_APP_ID**: App ID del portal de desarrolladores de TikTok for Business
- **TIKTOK_APP_SECRET**: Secret de la misma aplicacion

Estas se solicitaran como secrets de Supabase durante la implementacion.

Tambien deberas configurar en el portal de TikTok la URL de redireccion:
`https://disruptivaa.lovable.app/auth/tiktok/callback`

## Cambios

### 1. Secrets de TikTok

Solicitar `TIKTOK_APP_ID` y `TIKTOK_APP_SECRET` como secrets de Supabase para uso en las edge functions.

### 2. Edge Function: `tiktok-oauth-exchange`

Crear `supabase/functions/tiktok-oauth-exchange/index.ts`:

- Recibe `auth_code` y `redirect_uri` del frontend
- Valida JWT del usuario via `getClaims()`
- Realiza POST a `https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/` con `app_id`, `secret` y `auth_code`
- Extrae `access_token` y `advertiser_ids` de la respuesta
- Upsert en `user_integrations` con `platform: 'tiktok_ads'`, guardando token, account_ids, y status `connected`
- Retorna `{ success: true, accountsCount }`

Configuracion en `supabase/config.toml`:
```text
[functions.tiktok-oauth-exchange]
verify_jwt = false
```

### 3. Componente: `TikTokOAuthButton.tsx`

Crear un boton OAuth similar a `GoogleOAuthButton` y `MetaOAuthButton`:

- Genera un `state` aleatorio y lo guarda en `sessionStorage`
- Construye la URL de autorizacion de TikTok: `https://business-api.tiktok.com/portal/auth?app_id={APP_ID}&state={state}&redirect_uri={redirect_uri}`
- El `APP_ID` se obtiene desde una variable de entorno publica o se hardcodea (es un ID publico, no un secret)
- Redirige al usuario a TikTok para autorizar

### 4. Pagina: `TikTokCallback.tsx`

Crear `src/pages/TikTokCallback.tsx` siguiendo el patron exacto de `MetaCallback.tsx` y `GoogleCallback.tsx`:

- Captura `auth_code` de los query params
- Valida `state` contra sessionStorage
- Invoca la edge function `tiktok-oauth-exchange`
- Muestra estados: processing, success, error
- Toast traducido: "TikTok conectado con exito!"
- Redirige a `/connections`

### 5. Ruta en `App.tsx`

Agregar la ruta:
```text
<Route path="/auth/tiktok/callback" element={<TikTokCallback />} />
```

### 6. Actualizacion de `Connections.tsx`

Reemplazar el boton generico de TikTok por el nuevo `TikTokOAuthButton` (similar a como Meta y Google usan sus botones OAuth dedicados).

### 7. Edge Function: `fetch-tiktok-ads-metrics` (datos reales)

Modificar la edge function existente para hacer llamadas reales a la TikTok Marketing API:

- Cuando hay `access_token` y `account_ids`, llamar a:
  `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/`
- Campos: `spend`, `impressions`, `clicks`, `conversion` (mapeados via `metricFieldMap` existente)
- Parametros: `advertiser_id`, `start_date`, `end_date`, `report_type: BASIC`, `data_level: AUCTION_ADVERTISER`
- Eliminar el bloque de datos demo cuando hay integracion real (lineas 188-207)
- Mantener fallback a demo solo cuando no hay integracion conectada

### 8. Smart Alerts: Integracion TikTok

Modificar `useGoalMetrics.ts` para soportar `tiktok_ads` como plataforma:

- Agregar `"tiktok_ads"` al tipo union de `platform`
- Mapear a `fetch-tiktok-ads-metrics` en la logica de seleccion de funcion
- El hook `useSmartAlerts` ya consume `useGoalMetrics` y calculara desviaciones automaticamente para TikTok

### 9. OmnichannelPerformance: Limpiar nota demo

En `OmnichannelPerformance.tsx`:
- Eliminar la seccion de "TikTok Demo Note" condicional (lineas 128-133) ya que dejara de haber modo demo cuando haya conexion real
- La nota solo se mostrara si `isDemo` es true (ya manejado por la logica existente de `allDemo`)

### 10. Traducciones i18n

Agregar/actualizar claves en `es.json`, `en.json`, `pt.json`:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `connections.tiktokSuccess` | TikTok conectado con exito! | TikTok connected successfully! | TikTok conectado com sucesso! |
| `connections.processingTikTok` | Conectando con TikTok... | Connecting to TikTok... | Conectando com TikTok... |
| `connections.processingTikTokDesc` | Verificando tu cuenta de TikTok Ads | Verifying your TikTok Ads account | Verificando sua conta TikTok Ads |
| `connections.successTikTok` | Tu cuenta de TikTok Ads ha sido vinculada | Your TikTok Ads account has been linked | Sua conta TikTok Ads foi vinculada |
| `connections.tiktokConnectLabel` | Conectar con TikTok | Connect with TikTok | Conectar com TikTok |

## Seccion Tecnica

### Flujo OAuth de TikTok

```text
Usuario -> Click "Conectar con TikTok"
  -> Redirige a business-api.tiktok.com/portal/auth
  -> Usuario autoriza
  -> TikTok redirige a /auth/tiktok/callback?auth_code=XXX&state=YYY
  -> TikTokCallback.tsx valida state
  -> Invoca tiktok-oauth-exchange edge function
  -> Edge function intercambia auth_code por access_token
  -> Guarda en user_integrations
  -> Toast de exito + redirige a /connections
```

### TikTok Marketing API - Report Endpoint

```text
POST https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/

Headers:
  Access-Token: {access_token}
  Content-Type: application/json

Body:
{
  "advertiser_id": "123456",
  "report_type": "BASIC",
  "data_level": "AUCTION_ADVERTISER",
  "dimensions": ["stat_time_day"],
  "metrics": ["spend", "impressions", "clicks", "conversion", "cpc", "ctr", "cpm"],
  "start_date": "2026-02-01",
  "end_date": "2026-02-17",
  "page_size": 365
}
```

### Nota sobre APP_ID publico

El `TIKTOK_APP_ID` se necesita tanto en el frontend (para construir la URL de autorizacion) como en el backend (para el intercambio de token). Dado que es un identificador publico (similar al Client ID de Google), se puede exponer en el frontend como variable de entorno `VITE_TIKTOK_APP_ID` en el archivo `.env`, o se puede hardcodear. El `TIKTOK_APP_SECRET` permanece exclusivamente como secret de Supabase.

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `supabase/functions/tiktok-oauth-exchange/index.ts` | Nuevo: edge function OAuth |
| `supabase/config.toml` | Agregar config tiktok-oauth-exchange |
| `src/components/TikTokOAuthButton.tsx` | Nuevo: boton OAuth |
| `src/pages/TikTokCallback.tsx` | Nuevo: pagina callback |
| `src/App.tsx` | Agregar ruta /auth/tiktok/callback |
| `src/pages/Connections.tsx` | Usar TikTokOAuthButton |
| `supabase/functions/fetch-tiktok-ads-metrics/index.ts` | Reemplazar demo por API real |
| `src/hooks/useGoalMetrics.ts` | Agregar soporte tiktok_ads |
| `src/components/OmnichannelPerformance.tsx` | Limpiar nota demo TikTok |
| `src/i18n/locales/es/common.json` | Traducciones TikTok |
| `src/i18n/locales/en/common.json` | Traducciones TikTok |
| `src/i18n/locales/pt/common.json` | Traducciones TikTok |
