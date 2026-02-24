

# Correccion: Cuentas publicitarias no aparecen en Google Ads y TikTok Ads

## Problemas encontrados

### Problema 1: TikTok Ads usa "manual" en vez de "tiktok_ads"
El template de TikTok en `dashboardTemplates.ts` tiene `platform: "manual"` y todos sus widgets tienen `data_source: "manual"`. Por eso el dialogo muestra "Vincular cuenta de **Manual**" y la funcion `getAccountDetailsByPlatform` nunca se llama con "tiktok_ads", asi que las 2 cuentas publicitarias reales que estan guardadas en la base de datos no se muestran.

### Problema 2: Google Ads no obtiene las cuentas publicitarias
La Edge Function `google-oauth-exchange` guarda `account_ids: []` (vacio). A diferencia de TikTok (que recibe los `advertiser_ids` directamente en la respuesta del token), Google requiere una llamada adicional a la API de Google Ads para descubrir las cuentas accesibles. Esta llamada nunca se implemento, por lo que la funcion `getAccountDetailsByPlatform('google_ads')` siempre retorna la cuenta demo de fallback.

## Solucion

### Cambio 1: Corregir template TikTok - `src/data/dashboardTemplates.ts`
- Cambiar `platform: "manual"` a `platform: "tiktok_ads"` en el template
- Cambiar `data_source: "manual"` a `data_source: "tiktok_ads"` en los 5 widgets del template

### Cambio 2: Agregar "tiktok_ads" al mapa de nombres - `src/components/dashboards/BulkAccountAssignDialog.tsx`
- Ya esta incluido, no requiere cambios

### Cambio 3: Obtener cuentas reales de Google Ads - `supabase/functions/google-oauth-exchange/index.ts`
Despues de obtener el access_token, hacer una llamada a la Google Ads API para descubrir las cuentas accesibles:
- Llamar a `https://googleads.googleapis.com/v17/customers:listAccessibleCustomers` con el access_token
- Para cada customer ID obtenido, llamar al endpoint de Google Ads para obtener el nombre descriptivo
- Guardar los IDs en `account_ids` y un nombre descriptivo en `account_name`
- Requiere el secret `GOOGLE_ADS_DEVELOPER_TOKEN` (ya configurado en Supabase)

### Cambio 4: Eliminar cuentas demo de fallback - `src/hooks/useIntegrations.ts`
- Eliminar los bloques que retornan "Google Ads Demo Account" y "TikTok Ads Demo Account" cuando no hay `account_ids`
- Si no hay cuentas, retornar array vacio para que el dialogo muestre el mensaje de "No hay cuentas vinculadas. Ve a Conexiones..."

### Cambio 5: Corregir widgets TikTok existentes en la base de datos
- Los widgets de TikTok ya creados tienen `data_source: "manual"`, necesitan actualizarse a `data_source: "tiktok_ads"` mediante una migracion SQL

## Detalles tecnicos

### Google Ads API - Descubrimiento de cuentas
```text
GET https://googleads.googleapis.com/v17/customers:listAccessibleCustomers
Headers:
  Authorization: Bearer {access_token}
  developer-token: {GOOGLE_ADS_DEVELOPER_TOKEN}

Response: { "resourceNames": ["customers/1234567890", "customers/9876543210"] }
```

Para cada ID, se obtiene el nombre:
```text
GET https://googleads.googleapis.com/v17/customers/{id}
Headers: (mismos)

Response incluye: { "descriptiveName": "Mi Empresa - Google Ads" }
```

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/data/dashboardTemplates.ts` | Cambiar "manual" por "tiktok_ads" en template TikTok |
| `supabase/functions/google-oauth-exchange/index.ts` | Agregar descubrimiento de cuentas via Google Ads API |
| `src/hooks/useIntegrations.ts` | Eliminar fallback de cuentas demo para Google/TikTok |
| Migracion SQL | Actualizar widgets existentes de "manual" a "tiktok_ads" |

### Despliegue
- Redesplegar la Edge Function `google-oauth-exchange`
- El usuario debera reconectar Google Ads para que se obtengan las cuentas reales (o podemos agregar un endpoint separado de descubrimiento)

