## Objetivo
Mostrar un botón "Reconectar" dentro de la tarjeta de cada integración cuando el token esté en estado `expired`, que dispare el flujo OAuth correspondiente (Meta, Google Ads o TikTok Ads) para re-autenticar sin pasar por desconectar manualmente.

## Cambios

### 1. `src/components/connections/TokenStatusBadge.tsx`
- Exportar (ya existe) el helper `getTokenStatus()` para poder consultar el `kind` desde fuera.

### 2. `src/pages/Connections.tsx`
- Importar `getTokenStatus` y calcular `tokenStatus = getTokenStatus(integration)` para cada integración conectada.
- Cuando `isConnected && tokenStatus.kind === 'expired'`:
  - Mostrar un bloque destacado (fondo `bg-destructive/10`, borde `border-destructive/20`) con icono `AlertTriangle` y texto i18n `connections.tokenExpiredNotice`.
  - Reemplazar el botón "Desconectar" por **dos botones**:
    - **Reconectar** (variant primario, icono `RefreshCw`): renderiza el OAuth button correspondiente (`MetaOAuthButton`, `GoogleOAuthButton`, `TikTokOAuthButton`) con un prop nuevo opcional `label` o, más sencillo, envolver con un wrapper que cambie el texto.
    - **Desconectar** (variant outline, secundario, más pequeño).

### 3. Botones OAuth (`MetaOAuthButton`, `GoogleOAuthButton`, `TikTokOAuthButton`)
- Añadir prop opcional `variant?: 'connect' | 'reconnect'` que:
  - Cambia el texto del botón a `t('connections.reconnect')` cuando sea `reconnect`.
  - Cambia el icono a `RefreshCw`.
- Mantener el comportamiento OAuth idéntico (mismo `redirect_uri`, mismo flujo, sobreescribirá la fila existente al volver del callback).

### 4. i18n (`es`, `en`, `pt` en `common.json`)
Añadir claves:
- `connections.reconnect` — "Reconectar" / "Reconnect" / "Reconectar"
- `connections.reconnecting` — "Reconectando..." / "Reconnecting..." / "Reconectando..."
- `connections.tokenExpiredNotice` — "Tu sesión expiró. Reconecta para seguir recibiendo métricas."

## Notas técnicas
- No se requieren cambios en backend ni en las Edge Functions OAuth: el callback ya hace `upsert` por `(user_id, platform)`, así que reconectar reemplaza el token expirado.
- No se modifica `useIntegrations` salvo que sea necesario reusar `getTokenStatus` (ya vive en `TokenStatusBadge.tsx`).
- El badge `TokenStatusBadge` permanece visible arriba; el botón Reconectar es la acción explícita debajo.
