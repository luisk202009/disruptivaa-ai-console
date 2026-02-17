
# Sprint 7 - Tarea 1: Divisas Dinamicas

## Resumen

Eliminar el simbolo "$" y "USD" hardcodeados en todos los widgets y reemplazarlos con formateo dinamico basado en la moneda real de cada cuenta publicitaria. La moneda fluye desde las Edge Functions hasta los widgets a traves de `MetricData.currency`.

## Cambios

### 1. Edge Function: `fetch-meta-metrics` devuelve `currency`

Ya se obtiene el nombre de la cuenta via `act_{id}?fields=name`. Agregar `currency` al query:

```text
fields=name,currency  -->  response incluye { currency: "COP" }
```

Incluir el campo `currency` en el JSON de respuesta junto a `value`, `data_points`, etc.

Aplicar el mismo patron a `fetch-google-ads-metrics` y `fetch-tiktok-ads-metrics` (Google Ads devuelve `customer.currency_code`, TikTok usa USD por defecto en demo mode).

### 2. Interfaces de datos

**`src/hooks/useMetaMetrics.ts` - `MetricData`**:
- Agregar `currency?: string` a la interfaz `MetricData`
- Actualizar `formatValue` para aceptar un tercer parametro `currency: string = "USD"`
- Usar `Intl.NumberFormat` con la moneda recibida en vez de "USD" hardcodeado

**`src/hooks/useWidgets.ts` - `MetricConfig`**:
- Agregar `currency?: string` a `MetricConfig` para override manual por widget

**`src/hooks/useOmnichannelMetrics.ts` - `PlatformMetrics`**:
- Agregar `currency?: string` a `PlatformMetrics`
- Capturar el campo `currency` de la respuesta de cada edge function

### 3. Formateador de moneda centralizado

En `useMetaMetrics.formatValue`:

```text
Antes:  formatValue(value, metric)         -> siempre "$" USD
Despues: formatValue(value, metric, "COP") -> "$" formato colombiano
         formatValue(value, metric, "EUR") -> "EUR" formato europeo
         formatValue(value, metric)        -> fallback "USD"
```

Usa `Intl.NumberFormat` con el locale apropiado segun la moneda:
- COP -> es-CO, sin decimales (pesos colombianos no usan centavos)
- EUR -> es-ES
- USD -> en-US
- Otros -> default locale con el codigo de moneda

### 4. Actualizacion de Widgets

Todos los widgets que usan `formatValue` pasan la moneda:

| Widget | Cambio |
|--------|--------|
| `KPIWidget.tsx` | Pasar `data.currency` o `widget.metric_config.currency` a `formatValue` |
| `AreaChartWidget.tsx` | Pasar currency en Y-axis `tickFormatter` y `Tooltip formatter` |
| `LineChartWidget.tsx` | Idem: Y-axis y tooltip |
| `BarChartWidget.tsx` | Idem: Y-axis y tooltip |
| `PieChartWidget.tsx` | Idem: tooltip formatter |
| `GoalTrackerWidget.tsx` | Usar `goal.currency` si existe |

### 5. OmnichannelPerformance

- Capturar `currency` de la primera plataforma activa
- Reemplazar `$${totalSpend.toLocaleString(...)}` por `Intl.NumberFormat` con la moneda detectada
- Aplicar a KPICards de Total Spend, Combined CPA
- En el bar chart tooltip, usar la moneda detectada

### 6. DashboardWidget (contenedor)

- Extraer `currency` de `result.data.currency` cuando se recibe la respuesta de `fetchMetric`
- Inyectarlo en `MetricData` para que este disponible en los sub-widgets

### 7. Fallback seguro

Cadena de prioridad para determinar la moneda:
1. `data.currency` (viene del edge function, moneda real de la cuenta)
2. `widget.metric_config.currency` (override manual del usuario)
3. `"USD"` (fallback por defecto)

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `supabase/functions/fetch-meta-metrics/index.ts` | Agregar `currency` al query de cuenta y al response |
| `supabase/functions/fetch-google-ads-metrics/index.ts` | Agregar `currency` al response |
| `supabase/functions/fetch-tiktok-ads-metrics/index.ts` | Agregar `currency: "USD"` al response (demo) |
| `src/hooks/useMetaMetrics.ts` | Agregar `currency` a `MetricData`, actualizar `formatValue` |
| `src/hooks/useWidgets.ts` | Agregar `currency` a `MetricConfig` |
| `src/hooks/useOmnichannelMetrics.ts` | Agregar `currency` a `PlatformMetrics`, capturarlo |
| `src/components/dashboards/widgets/KPIWidget.tsx` | Usar currency dinamica |
| `src/components/dashboards/widgets/AreaChartWidget.tsx` | Usar currency dinamica |
| `src/components/dashboards/widgets/LineChartWidget.tsx` | Usar currency dinamica |
| `src/components/dashboards/widgets/BarChartWidget.tsx` | Usar currency dinamica |
| `src/components/dashboards/widgets/PieChartWidget.tsx` | Usar currency dinamica |
| `src/components/dashboards/widgets/GoalTrackerWidget.tsx` | Usar currency dinamica |
| `src/components/OmnichannelPerformance.tsx` | Usar currency dinamica en KPIs y chart |

## Sin cambios de base de datos

No se requieren migraciones. El campo `currency` ya existe en `project_goals`. La moneda del widget se almacena dentro del JSONB `metric_config` existente.
