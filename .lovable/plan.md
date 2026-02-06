
# Plan: Refresh Token Automation y Widgets de Metas Reales

## Resumen Ejecutivo

Este plan aborda cuatro áreas clave:
1. Automatización del refresh token para Google Ads
2. Conexión de widgets de metas con datos reales de APIs
3. Mejoras en la búsqueda del Sidebar (filtrar proyectos además de conversaciones)
4. Preparación completa para internacionalización (i18n)

---

## 1. Automatización de Refresh Token (Google Ads)

### Análisis del Estado Actual

La Edge Function `fetch-google-ads-metrics` actualmente:
- Recupera `access_token` y `refresh_token` de `user_integrations`
- **NO** verifica si el token ha expirado (`token_expires_at`)
- **NO** implementa lógica de refresh automático

### Cambios a Implementar

**Archivo:** `supabase/functions/fetch-google-ads-metrics/index.ts`

**Nueva función helper:**
```typescript
async function refreshGoogleToken(
  supabaseAdmin: SupabaseClient,
  userId: string,
  refreshToken: string
): Promise<{ access_token: string; expires_at: Date } | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  
  if (!response.ok) return null;
  
  const data = await response.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  
  // Update database
  await supabaseAdmin
    .from("user_integrations")
    .update({
      access_token: data.access_token,
      token_expires_at: expiresAt.toISOString(),
    })
    .eq("user_id", userId)
    .eq("platform", "google_ads");
    
  return { access_token: data.access_token, expires_at: expiresAt };
}
```

**Lógica de verificación antes de usar el token:**
```typescript
// Get integration with token_expires_at
const { data: integration } = await supabaseAdmin
  .from("user_integrations")
  .select("access_token, refresh_token, token_expires_at, account_ids")
  .eq("user_id", user.id)
  .eq("platform", "google_ads")
  .eq("status", "connected")
  .single();

let accessToken = integration?.access_token;

// Check if token is expired (with 5 min buffer)
if (integration?.token_expires_at) {
  const expiresAt = new Date(integration.token_expires_at);
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  
  if (Date.now() >= expiresAt.getTime() - bufferMs) {
    console.log("🔄 Token expired, refreshing...");
    const refreshed = await refreshGoogleToken(
      supabaseAdmin,
      user.id,
      integration.refresh_token!
    );
    if (refreshed) {
      accessToken = refreshed.access_token;
      console.log("✅ Token refreshed successfully");
    } else {
      console.error("❌ Failed to refresh token");
    }
  }
}
```

---

## 2. Widgets de Metas con Datos Reales

### Análisis del Estado Actual

- `ProjectHealthCard.tsx` usa `getSimulatedCurrentValue()` con valores hardcodeados
- El hook `useMetaMetrics` ya existe y puede obtener datos reales
- Falta un hook que obtenga métricas específicas para goals

### Cambios a Implementar

#### 2.1 Nuevo Hook: `useGoalMetrics.ts`

**Archivo:** `src/hooks/useGoalMetrics.ts`

```typescript
interface GoalMetricData {
  goal: ProjectGoal;
  currentValue: number;
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;
}

export const useGoalMetrics = (
  goals: ProjectGoal[],
  accountId?: string,
  platform: "meta_ads" | "google_ads" = "meta_ads"
) => {
  // Fetches real metrics for each goal
  // Maps goal.metric_key to API metric names
  // Returns { metricsData, loading, refresh }
};
```

**Mapeo de métricas:**
```typescript
const GOAL_TO_API_METRIC: Record<GoalMetricKey, string> = {
  cpa: "cpc", // Will calculate from spend/conversions
  roas: "roas",
  ctr: "ctr",
  cpc: "cpc",
  spend: "spend",
  conversions: "conversions",
};
```

#### 2.2 Actualizar `ProjectHealthCard.tsx`

**Archivo:** `src/components/projects/ProjectHealthCard.tsx`

**Cambios:**
1. Importar y usar `useGoalMetrics` en lugar de `getSimulatedCurrentValue()`
2. Mostrar indicador de carga mientras se obtienen métricas
3. Mostrar badge "Demo" si los datos no son reales
4. Añadir botón "Refrescar Datos"

**Props actualizadas:**
```typescript
interface ProjectHealthCardProps {
  projectId: string;
  projectColor: string;
  accountId?: string;         // ID de cuenta conectada
  platform?: "meta_ads" | "google_ads";
  onRefresh?: () => void;     // Callback para refresh
}
```

#### 2.3 Botón "Refrescar Datos" en `ProjectDetail.tsx`

**Archivo:** `src/pages/ProjectDetail.tsx`

**Ubicación:** En el header, junto al botón de "Metas"

```tsx
<Button 
  variant="outline" 
  onClick={handleRefreshMetrics}
  disabled={refreshing}
>
  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
  {t("projectDetail.refreshData")}
</Button>
```

---

## 3. Mejora de Búsqueda en Sidebar

### Estado Actual

La búsqueda en el Sidebar (líneas 116-122) solo filtra conversaciones por título:

```typescript
const filteredConversations = useMemo(() => {
  if (!searchQuery.trim()) return conversations;
  const query = searchQuery.toLowerCase();
  return conversations.filter(convo => 
    convo.title?.toLowerCase().includes(query)
  );
}, [conversations, searchQuery]);
```

### Cambios a Implementar

**Archivo:** `src/components/Sidebar.tsx`

**1. Añadir filtro de proyectos:**
```typescript
const filteredProjects = useMemo(() => {
  if (!searchQuery.trim()) return projects;
  const query = searchQuery.toLowerCase();
  return projects.filter(project => 
    project.name.toLowerCase().includes(query)
  );
}, [projects, searchQuery]);
```

**2. Mostrar resultados de proyectos en búsqueda:**
- Cuando hay query de búsqueda activa, mostrar proyectos que coincidan
- Los proyectos filtrados deben ser clickeables y redirigir a `/project/:id`

**3. Destacar resultados:**
- Resaltar el texto que coincide con la búsqueda
- Agrupar resultados: "Proyectos (N)" y "Conversaciones (N)"

---

## 4. Preparación para i18n

### Archivos a Actualizar

| Archivo | Textos a Traducir |
|---------|-------------------|
| `ProjectDetail.tsx` | Headers, labels, empty states |
| `ProjectHealthCard.tsx` | Títulos, estados, badges |
| `ProjectGoalsEditor.tsx` | Labels de métricas (ya parcial) |

### Nuevas Claves de Traducción

**Archivo:** `src/i18n/locales/es/common.json`

```json
{
  "projectDetail": {
    "title": "Detalle del Proyecto",
    "conversations": "Conversaciones del Proyecto",
    "noConversations": "Aún no hay conversaciones en este proyecto.",
    "startFirst": "Iniciar primera conversación",
    "goals": "Metas",
    "newConversation": "Nueva Conversación",
    "refreshData": "Actualizar Datos",
    "refreshing": "Actualizando..."
  },
  "projectHealth": {
    "title": "Estado del Proyecto",
    "overallStatus": "Estado General",
    "healthy": "Saludable",
    "warning": "Atención",
    "critical": "Crítico",
    "neutral": "Sin metas",
    "goal": "Meta",
    "goalsAchieved": "{count} de {total} metas cumplidas",
    "defineGoals": "Define metas para ver el estado de salud del proyecto.",
    "activeGoals": "Objetivos Activos",
    "noGoals": "Sin objetivos definidos",
    "defineGoal": "Definir Meta",
    "demoData": "Datos de demostración"
  }
}
```

**Archivo:** `src/i18n/locales/en/common.json`

```json
{
  "projectDetail": {
    "title": "Project Detail",
    "conversations": "Project Conversations",
    "noConversations": "No conversations in this project yet.",
    "startFirst": "Start first conversation",
    "goals": "Goals",
    "newConversation": "New Conversation",
    "refreshData": "Refresh Data",
    "refreshing": "Refreshing..."
  },
  "projectHealth": {
    "title": "Project Status",
    "overallStatus": "Overall Status",
    "healthy": "Healthy",
    "warning": "Warning",
    "critical": "Critical",
    "neutral": "No goals",
    "goal": "Goal",
    "goalsAchieved": "{count} of {total} goals achieved",
    "defineGoals": "Define goals to see project health status.",
    "activeGoals": "Active Goals",
    "noGoals": "No goals defined",
    "defineGoal": "Define Goal",
    "demoData": "Demo data"
  }
}
```

---

## Resumen de Archivos a Modificar/Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/functions/fetch-google-ads-metrics/index.ts` | **Modificar** | Añadir lógica de refresh token |
| `src/hooks/useGoalMetrics.ts` | **Crear** | Hook para obtener métricas reales de goals |
| `src/components/projects/ProjectHealthCard.tsx` | **Modificar** | Conectar con datos reales, añadir refresh |
| `src/pages/ProjectDetail.tsx` | **Modificar** | Añadir botón refresh, i18n |
| `src/components/Sidebar.tsx` | **Modificar** | Añadir filtro de proyectos |
| `src/i18n/locales/es/common.json` | **Modificar** | Añadir claves de traducción |
| `src/i18n/locales/en/common.json` | **Modificar** | Añadir claves de traducción |
| `src/i18n/locales/pt/common.json` | **Modificar** | Añadir claves de traducción |

---

## Flujo de Datos: Metas vs Realidad

```text
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO DE COMPARACIÓN                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ProjectDetail carga goals desde Supabase                   │
│                    ↓                                            │
│  2. useGoalMetrics recibe goals[]                              │
│                    ↓                                            │
│  3. Para cada goal:                                            │
│     - Mapea metric_key → API metric                            │
│     - Llama a fetch-meta-metrics o fetch-google-ads-metrics    │
│                    ↓                                            │
│  4. API verifica token_expires_at                              │
│     - Si expirado: refresh automático                          │
│     - Si válido: usa access_token actual                       │
│                    ↓                                            │
│  5. Retorna datos reales o demo con flag is_demo               │
│                    ↓                                            │
│  6. ProjectHealthCard renderiza:                               │
│     - Progreso de cada meta                                    │
│     - Badge de estado general                                  │
│     - Indicador "Demo" si aplica                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verificación Post-Implementación

- [ ] El token de Google se refresca automáticamente cuando expira
- [ ] Las métricas reales se muestran en ProjectHealthCard si hay conexión
- [ ] Se muestra badge "Demo" cuando los datos son simulados
- [ ] El botón "Refrescar Datos" fuerza actualización de métricas
- [ ] La búsqueda en el Sidebar filtra proyectos y conversaciones
- [ ] Todos los textos usan `t()` para traducción
- [ ] Las traducciones existen en ES, EN y PT
