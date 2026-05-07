## Objetivo

Mostrar en cada tarjeta de la página de Conexiones (`/connections`) un indicador claro del estado del token de acceso, y reforzar el banner de tokens expirados con un tooltip que explique por qué aparece.

## Estados del token a mostrar

Por cada integración conectada se calcula uno de estos estados:

1. **Activo** (verde) — `token_expires_at` está a más de 7 días, o no expira.
2. **Próximo a expirar** (ámbar) — expira en menos de 7 días pero más de 0.
3. **Renovable automáticamente** (azul/info) — expirado o por expirar, pero `has_refresh_token === true`. No requiere acción del usuario.
4. **Expirado** (rojo) — ya pasó `token_expires_at` y no hay refresh token. Requiere reconectar.

Texto humano: "Expira en 3 días", "Renovable automáticamente", "Expiró hace 2 horas", usando `formatDistanceToNow` de date-fns con el locale ya disponible.

## Cambios

### 1. Nuevo helper `getTokenStatus(integration)` en `src/hooks/useIntegrations.ts`

Devuelve `{ kind: 'active' | 'expiring' | 'refreshable' | 'expired' | 'none', expiresAt: Date | null }`. Se exporta junto con el hook para poder reutilizarse en otros componentes (banner, widget de conectividad).

### 2. Nuevo componente `src/components/connections/TokenStatusBadge.tsx`

- Recibe la `Integration` y muestra un badge compacto con icono Lucide (`CheckCircle2`, `Clock`, `RefreshCw`, `AlertTriangle`) + texto del estado + tiempo relativo.
- Envuelto en `Tooltip` (ya existe `src/components/ui/tooltip.tsx`) que explica:
  - Activo: "Tu token es válido hasta {fecha}".
  - Expiring: "Caduca pronto. Si la plataforma soporta renovación automática, lo haremos por ti".
  - Refreshable: "El token caducó pero será renovado automáticamente en la próxima petición usando el refresh token guardado".
  - Expired: "Debes reconectar la cuenta para seguir recibiendo métricas".
- Usa tokens semánticos del design system (`text-emerald-400`, `text-amber-400`, `text-sky-400`, `text-destructive`) ya presentes en el proyecto.

### 3. Integración en `src/pages/Connections.tsx`

- Importar `TokenStatusBadge` y mostrarlo bajo el bloque "Connected · hace X" cuando la integración esté conectada.
- Mantener todo el resto de la tarjeta intacto.

### 4. Tooltip en `src/components/dashboards/ExpiredTokenBanner.tsx`

- Envolver el icono `AlertTriangle` (o el título) en un `Tooltip` que explique por qué aparece el banner: "Este aviso aparece cuando una o más integraciones tienen tokens caducados sin posibilidad de renovación automática. Reconéctalas para no perder métricas."
- Asegurar que `TooltipProvider` esté disponible (ya está en `App.tsx`; verificar antes de añadirlo de nuevo).

### 5. Strings i18n

Añadir claves en `src/i18n/locales/{es,en,pt}/common.json` bajo `connections.tokenStatus.*` y `widget.expiredBannerTooltip`:
- `active`, `expiring`, `refreshable`, `expired`
- `activeTooltip`, `expiringTooltip`, `refreshableTooltip`, `expiredTooltip`
- `widget.expiredBannerTooltip`

## Notas técnicas

- No se modifica el esquema de base de datos: se usan `token_expires_at` y `refresh_token` ya consultados.
- Sin cambios en Edge Functions ni en la lógica de renovación (ya implementada).
- Solo cambios de UI/presentación, en línea con la regla del proyecto.
