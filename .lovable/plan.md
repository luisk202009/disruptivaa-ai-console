

# Sprint 8, Tarea 5: Optimizacion de Performance

## Resumen

Implementar cache backend en Edge Functions, optimizar TanStack Query defaults, aplicar lazy loading en rutas pesadas, mejorar skeletons en KPIWidget, y agregar indicador "Datos actualizados hace X minutos".

## 1. Cache Backend en Edge Functions

### Estrategia

Usar una tabla Supabase `metrics_cache` para almacenar respuestas de API por 5 minutos, indexadas por `user_id`, `platform`, `metric`, `date_preset` y `account_id`. Las tres Edge Functions (`fetch-meta-metrics`, `fetch-google-ads-metrics`, `fetch-tiktok-ads-metrics`) consultaran la cache antes de llamar a la API externa.

### Nueva tabla: `metrics_cache`

```text
metrics_cache
  id          uuid PK DEFAULT gen_random_uuid()
  user_id     uuid NOT NULL
  cache_key   text NOT NULL  -- hash de platform+metric+date_preset+account_id
  response    jsonb NOT NULL
  created_at  timestamptz DEFAULT now()
  expires_at  timestamptz NOT NULL
  
  UNIQUE(user_id, cache_key)
```

RLS: Solo el usuario puede ver/insertar/actualizar su propia cache. La Edge Function usa `service_role_key` asi que bypasea RLS, pero se activa igualmente por seguridad.

### Logica en cada Edge Function

Al inicio del handler (despues de autenticacion):

1. Construir `cache_key` = `{platform}:{metric}:{date_preset}:{account_id}`
2. Consultar `metrics_cache` WHERE `user_id` = userId AND `cache_key` = key AND `expires_at` > now()
3. Si existe: devolver `response` directamente (respuesta en ~50ms vs ~2s)
4. Si no existe: ejecutar flujo normal, y al final hacer UPSERT en `metrics_cache` con `expires_at = now() + 5 minutos`

### Archivos afectados

- `supabase/functions/fetch-meta-metrics/index.ts`
- `supabase/functions/fetch-google-ads-metrics/index.ts`
- `supabase/functions/fetch-tiktok-ads-metrics/index.ts`

Se agregara un bloque de ~15 lineas al inicio (cache check) y ~5 lineas al final (cache write) de cada funcion. La logica de negocio existente no cambia.

## 2. TanStack Query Defaults

### Archivo: `src/App.tsx`

Configurar `QueryClient` con defaults optimizados:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutos
      gcTime: 10 * 60 * 1000,      // 10 minutos (antes cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

Esto implementa stale-while-revalidate: los datos se sirven inmediatamente desde cache local y se revalidan en background despues de 5 minutos.

## 3. Lazy Loading y Code Splitting

### Archivo: `src/App.tsx`

Aplicar `React.lazy` + `Suspense` en las rutas mas pesadas:

- `/landing-builder` (LandingBuilder) -- contiene ResizablePanels + preview rendering
- `/admin` (AdminDashboard) -- contiene multiples tabs con email previewer
- `/dashboards/:dashboardId` (DashboardView) -- contiene GridLayout + Recharts

Las rutas ligeras (Auth, Index, etc.) se mantienen con import estatico.

El `Suspense` fallback usara el `LoadingScreen` existente simplificado (solo spinner + texto).

```typescript
const LandingBuilder = lazy(() => import("./pages/LandingBuilder"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DashboardView = lazy(() => import("./pages/DashboardView"));

// En Routes:
<Suspense fallback={<LazyFallback />}>
  <LandingBuilder />
</Suspense>
```

Se creara un componente `LazyFallback` minimalista inline en App.tsx (spinner centrado con texto "Cargando...").

## 4. Skeleton para KPIWidget

### Archivo: `src/components/dashboards/widgets/DashboardWidget.tsx`

Reemplazar el spinner de carga actual (lineas 126-131) con un skeleton que coincida con el layout real del KPIWidget:

```text
┌─────────────────────┐
│  [skeleton h-8 w-32] │  ← valor principal
│  [skeleton h-4 w-20] │  ← porcentaje cambio
│  [skeleton h-2 w-full]│  ← barra de progreso (si aplica)
└─────────────────────┘
```

Esto elimina el layout shift (CLS) cuando los datos se cargan.

## 5. Indicador "Datos actualizados hace X minutos"

### Archivo: `src/pages/DashboardView.tsx`

Agregar un timestamp en la esquina inferior derecha del header o en el footer del canvas:

- Almacenar `lastUpdated: Date | null` en estado
- Actualizar con `new Date()` cada vez que los widgets terminen de cargar
- Mostrar texto tipo: "Datos actualizados hace 2 min" usando `date-fns` (ya instalado): `formatDistanceToNow(lastUpdated, { addSuffix: true, locale: es })`
- El texto se actualiza cada 30 segundos con un intervalo

### Archivo: `src/components/dashboards/DashboardCanvas.tsx`

Pasar un callback `onDataLoaded` para notificar al padre cuando los widgets terminan de cargar. Alternativamente, el timestamp se calcula directamente en `DashboardView` basandose en cuando `widgetsLoading` cambia de `true` a `false`.

## 6. i18n

### Nuevas claves

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `dashboard.dataUpdated` | Datos actualizados | Data updated | Dados atualizados |
| `dashboard.updating` | Actualizando... | Updating... | Atualizando... |
| `common.loading` | Cargando... | Loading... | Carregando... |

## Archivos Afectados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| Nueva migracion SQL | Nuevo | Tabla `metrics_cache` |
| `supabase/functions/fetch-meta-metrics/index.ts` | Edicion | Cache check + write |
| `supabase/functions/fetch-google-ads-metrics/index.ts` | Edicion | Cache check + write |
| `supabase/functions/fetch-tiktok-ads-metrics/index.ts` | Edicion | Cache check + write |
| `src/App.tsx` | Edicion | QueryClient defaults + lazy imports + Suspense |
| `src/components/dashboards/widgets/DashboardWidget.tsx` | Edicion | Skeleton loading |
| `src/pages/DashboardView.tsx` | Edicion | Indicador de actualizacion |
| `src/i18n/locales/es/common.json` | Edicion | Nuevas claves |
| `src/i18n/locales/en/common.json` | Edicion | Nuevas claves |
| `src/i18n/locales/pt/common.json` | Edicion | Nuevas claves |

## Notas

- La cache en `useMetaMetrics.ts` (frontend, linea 60-63) ya implementa un TTL de 5 min en memoria. Con los nuevos defaults de TanStack Query y la cache backend, el sistema tendra 3 capas: TanStack Query (5min stale) -> useState cache (5min TTL) -> Supabase metrics_cache (5min TTL). Esto es intencional: cada capa cubre un escenario diferente (navegacion entre paginas, re-renders, y cold starts).
- Los skeletons en DashboardWidget reemplazaran solo el spinner en el estado `loading` -- los estados de error y configuracion no se tocan.
- `date-fns` ya esta instalado como dependencia del proyecto.

