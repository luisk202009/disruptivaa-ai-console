

# Sprint 8, Tarea 2: Dashboard Comparativo

## Estado Actual

La infraestructura de comparacion ya existe parcialmente:
- La Edge Function `fetch-meta-metrics` ya calcula `previous_value`, `change_percent` y `trend`
- `KPIWidget` ya muestra indicadores de cambio con flechas verdes/rojas
- Sin embargo, las graficas NO reciben los `data_points` del periodo anterior — solo se muestra una linea

El trabajo principal es extender el flujo para que los `data_points` del periodo anterior lleguen hasta las graficas.

## Cambios Planificados

### 1. Edge Function: `fetch-meta-metrics` (y Google/TikTok equivalentes)

Incluir `previous_data_points` en la respuesta JSON cuando `comparison = true`. La funcion ya hace el fetch del periodo anterior para calcular el total, pero descarta los puntos individuales. El cambio es conservarlos y enviarlos.

```
Respuesta actual:   { value, previous_value, change_percent, trend, data_points }
Respuesta nueva:    { value, previous_value, change_percent, trend, data_points, previous_data_points }
```

Donde `previous_data_points` tiene la misma estructura `{ date, value }[]` pero con las fechas del periodo anterior.

### 2. Interface `MetricData` en `useMetaMetrics.ts`

Agregar campo opcional:
```typescript
previous_data_points?: { date: string; value: number }[];
```

### 3. KPIWidget — Internacionalizacion

El widget ya funciona correctamente con comparacion. Solo se necesita reemplazar el texto hardcoded "vs periodo anterior" por la clave i18n `t("comparison.vsPreviousPeriod")`.

Tambien se mejoraran los colores para usar exactamente los solicitados:
- Verde: `#10B981` (mejora)
- Rojo: `#EF4444` (empeora)
- Iconos: `ArrowUp` / `ArrowDown` de lucide (reemplazando `TrendingUp`/`TrendingDown` para un look mas limpio)

### 4. AreaChartWidget — Doble linea comparativa

Merge de `data_points` y `previous_data_points` en un solo array para Recharts, usando el indice como eje X (dia 1, dia 2...) para alinear ambos periodos:

```typescript
// Estructura del chartData mergeado:
[
  { date: "Lun 10", value: 1500, previousValue: 1200 },
  { date: "Mar 11", value: 1800, previousValue: 1100 },
  ...
]
```

Se renderizaran dos `<Area>`:
- **Linea principal**: Color de empresa (`var(--primary-company)`), solida, con relleno gradiente
- **Linea anterior**: Gris tenue (`#6B7280`), punteada (`strokeDasharray="5 5"`), sin relleno

El Tooltip mostrara ambos valores con etiquetas i18n ("Actual" / "Periodo anterior").

### 5. LineChartWidget — Misma logica de doble linea

Aplicar la misma estrategia de merge y renderizar dos `<Line>`:
- Principal: color empresa, solida
- Anterior: gris punteada

### 6. Etiquetas i18n (ES, EN, PT)

Nuevas claves bajo `comparison`:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `comparison.vsPreviousPeriod` | vs periodo anterior | vs previous period | vs periodo anterior |
| `comparison.growth` | Crecimiento | Growth | Crescimento |
| `comparison.performance` | Rendimiento | Performance | Desempenho |
| `comparison.currentPeriod` | Periodo actual | Current period | Periodo atual |
| `comparison.previousPeriod` | Periodo anterior | Previous period | Periodo anterior |

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/fetch-meta-metrics/index.ts` | Incluir `previous_data_points` en respuesta |
| `supabase/functions/fetch-google-ads-metrics/index.ts` | Mismo cambio |
| `supabase/functions/fetch-tiktok-ads-metrics/index.ts` | Mismo cambio |
| `src/hooks/useMetaMetrics.ts` | Agregar `previous_data_points` a `MetricData` |
| `src/components/dashboards/widgets/KPIWidget.tsx` | Usar i18n, colores exactos, iconos ArrowUp/Down |
| `src/components/dashboards/widgets/AreaChartWidget.tsx` | Doble area con periodo anterior |
| `src/components/dashboards/widgets/LineChartWidget.tsx` | Doble linea con periodo anterior |
| `src/i18n/locales/es/common.json` | Agregar claves `comparison.*` |
| `src/i18n/locales/en/common.json` | Agregar claves `comparison.*` |
| `src/i18n/locales/pt/common.json` | Agregar claves `comparison.*` |

## Estetica

- Fondo dark de la consola se mantiene intacto
- Linea principal usa `var(--primary-company)` (color dinamico de empresa)
- Linea de periodo anterior: `#6B7280` (zinc-500), punteada, opacidad 60%
- Gradiente del area principal usa el color de empresa con opacidad decreciente
- Indicadores KPI: verde `#10B981`, rojo `#EF4444`

## Flujo de Datos

```text
Edge Function (fetch-meta-metrics)
  ├── current period  → data_points[]  + value (total)
  └── previous period → previous_data_points[] + previous_value (total)
        ↓
  useMetaMetrics.fetchMetric()
        ↓
  DashboardWidget (pasa MetricData a cada widget)
        ↓
  ├── KPIWidget:       value vs previous_value → % cambio con flecha
  ├── AreaChartWidget:  merge data_points + previous_data_points → 2 areas
  └── LineChartWidget:  merge data_points + previous_data_points → 2 lineas
```
