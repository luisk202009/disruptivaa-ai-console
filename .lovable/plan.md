
## Problemas identificados

### 1. Banner falso de "Conexiones expiradas"
El token de acceso de Google OAuth expira en ~1 hora. El código en `getExpiredPlatforms()` marca como expirada cualquier integración cuyo `token_expires_at` sea menor a 24 horas. Como Google siempre expira en 1h, **inmediatamente después de conectar** aparece el banner de "expiradas".

Sin embargo, Google Ads tiene un `refresh_token` que permite renovar el access token automáticamente. La lógica de expiración debe ignorar plataformas que tengan refresh token disponible, ya que el Edge Function puede renovarlo antes de cada llamada.

### 2. API de Google Ads v17 devuelve 404
Los logs muestran que `/v17/customers:listAccessibleCustomers` retorna 404. La versión v17 fue retirada. La versión actual es **v18+**. Esto causa que al conectar no se descubran las cuentas publicitarias.

---

## Plan de cambios

### A. Actualizar versión de API en `google-oauth-exchange/index.ts`
- Cambiar `v17` a `v18` en las 3 URLs de la API de Google Ads (listAccessibleCustomers y detalle de cuenta).

### B. Actualizar versión de API en `fetch-google-ads-metrics/index.ts`
- Verificar y actualizar cualquier referencia a `v17` en esta Edge Function también.

### C. Corregir lógica de expiración en `useIntegrations.ts`
- Modificar `getExpiredPlatforms()` para excluir plataformas que tengan refresh token (Google Ads). Para esto:
  - Agregar `has_refresh_token` al SELECT de `fetchIntegrations` (verificando si `refresh_token IS NOT NULL` a nivel de la query o del campo).
  - Alternativamente, solo marcar como expiradas las plataformas donde `token_expires_at` haya **pasado** (no dentro de 24h), ya que los Edge Functions renuevan automáticamente con el refresh token.

### D. Agregar auto-refresh de token en `fetch-google-ads-metrics`
- Verificar que el Edge Function de métricas ya use el refresh token para renovar el access token cuando esté expirado antes de llamar a la API.

---

## Archivos a modificar
1. `supabase/functions/google-oauth-exchange/index.ts` — v17 → v18
2. `supabase/functions/fetch-google-ads-metrics/index.ts` — v17 → v18 + verificar refresh logic
3. `src/hooks/useIntegrations.ts` — ajustar `getExpiredPlatforms()` para no marcar Google Ads como expirado cuando tiene refresh token
