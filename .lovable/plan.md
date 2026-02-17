
# Sprint 7 - Tarea 2: Filtrado Inteligente de Cuentas

## Resumen

Actualmente `DashboardView.tsx` siempre carga cuentas de Meta Ads (`getMetaAccountDetails()`) sin importar la plataforma del dashboard. Los componentes `BulkAccountAssignDialog`, `WidgetSelector` y `WidgetSettings` reciben esas cuentas sin filtrado. La solucion: detectar la plataforma dominante del dashboard y filtrar cuentas estrictamente por esa plataforma.

## Cambios

### 1. Detectar plataforma dominante del Dashboard (`DashboardView.tsx`)

Agregar una funcion que analice los widgets del dashboard para determinar la plataforma dominante:

```text
Logica: Contar data_source de todos los widgets -> la plataforma con mas widgets gana
Fallback: si no hay widgets, usar "meta_ads"
```

Reemplazar la llamada `getMetaAccountDetails()` por `getAccountDetailsByPlatform(dominantPlatform)`.

Pasar `platform` como prop a `BulkAccountAssignDialog` y `WidgetSelector`.

### 2. Actualizar `BulkAccountAssignDialog.tsx`

- Agregar prop `platform?: string` a la interfaz
- Usar el nombre de la plataforma en los mensajes:
  - Titulo: "Vincular cuenta de [Platform]"
  - Empty state: "No hay cuentas de [Platform] vinculadas. Ve a Conexiones para anadir una."
- Mapeo de nombres: `{ meta_ads: "Meta Ads", google_ads: "Google Ads", tiktok_ads: "TikTok Ads" }`

### 3. Actualizar `WidgetSelector.tsx`

- Agregar prop `platform?: string` para pre-seleccionar el `data_source` del widget creado
- Cuando se crea un widget desde un dashboard con plataforma detectada, usar esa plataforma como `data_source` por defecto (en vez de hardcodear `"meta_ads"` en linea 108)
- Las cuentas mostradas en el paso "account" ya vienen filtradas desde `DashboardView`

### 4. `WidgetSettings.tsx` - Ya esta resuelto

Este componente ya implementa filtrado por plataforma correctamente:
- Tiene un selector de plataforma (linea 112)
- Llama a `getAccountDetailsByPlatform(platform)` en el `useEffect` (linea 63)
- Muestra mensaje contextual cuando no hay cuentas (linea 127-129)

No requiere cambios.

### 5. Mapeo de nombres de plataforma (constante reutilizable)

Crear constante `PLATFORM_DISPLAY_NAMES` en `DashboardView.tsx` (o reusar la existente de `WidgetSettings`):

```text
meta_ads    -> "Meta Ads"
google_ads  -> "Google Ads"
tiktok_ads  -> "TikTok Ads"
manual      -> "Manual"
```

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/DashboardView.tsx` | Detectar plataforma dominante, cargar cuentas filtradas, pasar `platform` como prop |
| `src/components/dashboards/BulkAccountAssignDialog.tsx` | Agregar prop `platform`, mensajes dinamicos por plataforma |
| `src/components/dashboards/WidgetSelector.tsx` | Agregar prop `platform`, usar como `data_source` por defecto |

## Sin cambios de base de datos

No se requieren migraciones. La deteccion se basa en el campo `data_source` ya existente en los widgets.
