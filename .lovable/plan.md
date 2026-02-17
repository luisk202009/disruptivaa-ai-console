
# Sprint 7 - Tarea 3: Activacion de Datos Reales

## Problema critico detectado

`useMetaMetrics.fetchMetric()` siempre invoca `fetch-meta-metrics` (linea 80) sin importar el `data_source` del widget. Esto significa que los widgets de Google Ads y TikTok Ads tambien llaman al endpoint de Meta, lo cual es incorrecto. Este es el fix principal de esta tarea.

## Cambios

### 1. Refactor de `useMetaMetrics.ts` - Routing dinamico por plataforma

Renombrar conceptualmente el hook a un router multi-plataforma. En `fetchMetric`, usar `widget.data_source` (pasado via `MetricConfig`) para determinar que edge function invocar:

| data_source | Edge Function |
|-------------|---------------|
| `meta_ads` | `fetch-meta-metrics` |
| `google_ads` | `fetch-google-ads-metrics` |
| `tiktok_ads` | `fetch-tiktok-ads-metrics` |

Cambios especificos:
- Agregar `data_source?: DataSource` a la interfaz `MetricConfig`
- En `fetchMetric`, reemplazar el hardcoded `"fetch-meta-metrics"` por un mapeo basado en `config.data_source`
- Fallback a `fetch-meta-metrics` si no se especifica

### 2. `DashboardWidget.tsx` - Pasar `data_source` al config

Cuando `DashboardWidget` llama a `fetchMetric(config)`, incluir `data_source: widget.data_source` en el config para que el hook sepa que edge function invocar.

### 3. Refactor de `OmnichannelPerformance.tsx` - Usar el hook

Actualmente este componente duplica toda la logica de fetching (lineas 37-108). Refactorizar para:
- Importar y usar `useOmnichannelMetrics` en vez de logica duplicada
- Consumir `data.loading` para el estado de carga
- Agregar estado `error` con mensaje amigable

### 4. Agregar `error` a `useOmnichannelMetrics.ts`

- Agregar campo `error: string | null` a `OmnichannelData`
- Capturar errores de cada plataforma y reportar un error consolidado si todas fallan
- Solo mostrar error si NINGUNA plataforma retorno datos

### 5. Skeletons en estados de carga

**`OmnichannelPerformance.tsx`**: Reemplazar el spinner basico (lineas 144-152) por Skeleton components que repliquen la estructura de los 3 KPI cards + bar chart:
- 3 skeleton rectangulos de la misma altura que los KPICards
- 1 skeleton rectangulo para el area del bar chart

**`DashboardCanvas.tsx`**: Mejorar los skeletons de carga (lineas 65-76) usando el componente `Skeleton` importado de `@/components/ui/skeleton` en vez de divs con `animate-pulse`.

### 6. Filtrar plataformas por integraciones conectadas

En `useOmnichannelMetrics`, antes de hacer fetch, consultar `user_integrations` para determinar que plataformas tiene conectadas el usuario. Solo invocar edge functions de plataformas con `status = 'connected'`.

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/hooks/useMetaMetrics.ts` | Routing dinamico por `data_source` en `fetchMetric` |
| `src/hooks/useWidgets.ts` | Agregar `data_source?: DataSource` a `MetricConfig` |
| `src/hooks/useOmnichannelMetrics.ts` | Agregar `error`, filtrar por integraciones conectadas |
| `src/components/dashboards/widgets/DashboardWidget.tsx` | Pasar `data_source` al config de fetchMetric |
| `src/components/OmnichannelPerformance.tsx` | Usar hook, Skeleton loading, estado error |
| `src/components/dashboards/DashboardCanvas.tsx` | Mejorar skeletons con componente Skeleton |

## Sin cambios de base de datos

No se requieren migraciones. Todo se basa en el campo `data_source` existente en la tabla `widgets` y `status` en `user_integrations`.
