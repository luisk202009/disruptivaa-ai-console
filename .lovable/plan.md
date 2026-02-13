
# Plan: Consolidación de Métricas Omnicanal y Enriquecimiento de Inteligencia del Agente

## Resumen Ejecutivo

El componente `OmnichannelPerformance.tsx` ya está implementado correctamente, pero necesitamos:
1. **Garantizar que TikTok usa datos mock consistentes** (no reales, ya que skipped OAuth)
2. **Enriquecer el edge function `disruptivaa-agent`** para recibir y procesar contexto omnicanal
3. **Modificar `CommandConsole.tsx`** para enviar métricas consolidadas al agente
4. **Validar traducciones** en los 3 idiomas

---

## Análisis del Estado Actual

### ✅ Lo que ya funciona bien:

1. **`OmnichannelPerformance.tsx` (líneas 1-236)**:
   - Fetch paralelo de 3 plataformas ✅
   - Cálculo de KPIs consolidados (totalSpend, combinedCPA, avgROAS) ✅
   - Gráfico de barras con colores correctos (Meta #1877F2, Google #4285F4, TikTok #EF7911) ✅
   - Soporte para demo data ✅
   - Traducciones en lugar ✅

2. **Traducciones de `omnichannel`** (en `common.json`):
   - Claves presentes en ES, EN y PT ✅
   - Labels para Gasto Total, CPA Combinado, ROAS Promedio ✅

3. **Edge function `disruptivaa-agent`**:
   - Soporta `action: "executive-summary"` ✅
   - Soporta contexto multilingüe ✅
   - Soporta contexto de `projectId` y goals ✅
   - Tiene instrucciones omnicanal (líneas 461-542) ✅

### ⚠️ Lo que necesita mejora:

1. **TikTok Mock Data**: 
   - `fetch-tiktok-ads-metrics` devuelve datos demo correctamente
   - Pero no hay garantía de que sea distinguible en el dashboard

2. **Enriquecimiento del agente**:
   - `CommandConsole.tsx` NO envía datos omnicanal consolidados al agente
   - El agente recibe solo `connectedPlatforms` (array de strings) en línea 211
   - NO envía los valores reales de CPA, ROAS, spend por plataforma para comparación

3. **Falta de contexto para análisis comparativo**:
   - El agente no puede hacer análisis omnicanal sin datos agregados
   - Las instrucciones OMNICHANNEL_INSTRUCTIONS están en el prompt del agente, pero sin datos concretos es difícil que sugiera redistribuciones

---

## Cambios Requeridos

### 1. Crear Hook `useOmnichannelMetrics` en `src/hooks/useOmnichannelMetrics.ts`

Este hook encapsula la lógica de fetch de datos omnicanal para reutilizarla en múltiples componentes.

**Responsabilidades:**
- Llamar `OmnichannelPerformance.tsx` internamente
- Extraer y retornar datos agregados: `{ meta, google, tiktok, totalSpend, combinedCPA, avgROAS, isDemo }`
- Manejo de carga y errores

**Tipo de retorno:**
```typescript
interface OmnichannelData {
  platforms: {
    meta: PlatformMetrics | null;
    google: PlatformMetrics | null;
    tiktok: PlatformMetrics | null;
  };
  consolidated: {
    totalSpend: number;
    combinedCPA: number;
    avgROAS: number;
    allDemo: boolean;
  };
  loading: boolean;
}
```

### 2. Modificar `src/components/CommandConsole.tsx` (línea ~211)

Actualizar el `requestBody` para incluir métricas omnicanal:

**Antes:**
```typescript
const requestBody = {
  message: userMessage,
  agentId: selectedAgent?.id || null,
  connectedPlatforms: connectedPlatforms.map(p => p.platform),
  chatId: currentChatId || null,
  // ... más campos
};
```

**Después:**
```typescript
// Obtener datos omnicanal si hay plataformas conectadas
let omnichannelContext = null;
if (connectedPlatforms.length > 1 || (isAdsOptimizer && connectedPlatforms.length > 0)) {
  // Fetch omnichannel data in background
  const omnichannelData = await fetchOmnichannelMetrics();
  omnichannelContext = {
    platforms: omnichannelData.platforms,
    totalSpend: omnichannelData.consolidated.totalSpend,
    combinedCPA: omnichannelData.consolidated.combinedCPA,
    avgROAS: omnichannelData.consolidated.avgROAS,
    isDemo: omnichannelData.consolidated.allDemo,
  };
}

const requestBody = {
  message: userMessage,
  agentId: selectedAgent?.id || null,
  connectedPlatforms: connectedPlatforms.map(p => p.platform),
  omnichannelMetrics: omnichannelContext, // 👈 NUEVO
  chatId: currentChatId || null,
  // ... más campos
};
```

### 3. Modificar `supabase/functions/disruptivaa-agent/index.ts` (línea ~596)

Actualizar el parsing del body para recibir datos omnicanal:

**Línea 597 - Cambiar:**
```typescript
const { message, agentId, agentName, systemInstruction, chatId, projectId, files, action, goalsData } = body;
```

**A:**
```typescript
const { message, agentId, agentName, systemInstruction, chatId, projectId, files, action, goalsData, omnichannelMetrics } = body;
```

**Agregar después de la verificación de usuario (línea ~675):**
```typescript
// Build omnichannel context for agent
let omnichannelContext = "";
if (omnichannelMetrics && (omnichannelMetrics.platforms.meta || omnichannelMetrics.platforms.google || omnichannelMetrics.platforms.tiktok)) {
  const activeMetrics = [
    omnichannelMetrics.platforms.meta ? `Meta Ads: Spend=$${omnichannelMetrics.platforms.meta.spend}, CPA=$${omnichannelMetrics.platforms.meta.cpa || 'N/A'}, ROAS=${omnichannelMetrics.platforms.meta.roas || 'N/A'}` : null,
    omnichannelMetrics.platforms.google ? `Google Ads: Spend=$${omnichannelMetrics.platforms.google.spend}, CPA=$${omnichannelMetrics.platforms.google.cpa || 'N/A'}, ROAS=${omnichannelMetrics.platforms.google.roas || 'N/A'}` : null,
    omnichannelMetrics.platforms.tiktok ? `TikTok Ads: Spend=$${omnichannelMetrics.platforms.tiktok.spend}, CPA=$${omnichannelMetrics.platforms.tiktok.cpa || 'N/A'}, ROAS=${omnichannelMetrics.platforms.tiktok.roas || 'N/A'} [DEMO DATA]` : null,
  ].filter(Boolean).join("\n");
  
  omnichannelContext = `
📊 OMNICHANNEL METRICS (Last 30 days):
${activeMetrics}
Total Spend: $${omnichannelMetrics.totalSpend}
Combined CPA: $${omnichannelMetrics.combinedCPA}
Avg ROAS: ${omnichannelMetrics.avgROAS}x
Demo Data: ${omnichannelMetrics.isDemo}
`;
}
```

**Luego, incluir este contexto en el prompt del sistema:**
```typescript
// Actualizar la construcción del systemPrompt alrededor de la línea 750-780
const systemPrompt = `${SYSTEM_INSTRUCTIONS[userLanguage]}

${omnichannelContext}

${goalsContext}

${languageInstruction}`;
```

### 4. Garantizar que TikTok siempre usa Demo Data

En `src/components/OmnichannelPerformance.tsx`, agregar un indicador explícito:

**En la función `fetchAllMetrics` (línea ~64):**
- Para TikTok, marcar siempre como `isDemo: true` (ya lo hace)
- En el tooltip o hover del widget de TikTok, mostrar "📊 Demo Data - OAuth Pending"

**En el KPI Card para TikTok** (agregar al lado del gráfico una nota pequeña):
```typescript
{data.tiktok && (
  <div className="text-xs text-muted-foreground italic">
    {t("omnichannel.tiktokDemoNote")}
  </div>
)}
```

### 5. Agregar traducciones faltantes (SI LAS HAY)

Revisar y completar en `src/i18n/locales/[es,en,pt]/common.json`:

```json
"omnichannel": {
  // ... existentes ...
  "tiktokDemoNote": "Datos de demostración - OAuth pendiente",
  "platformComparison": "Comparación de Plataformas",
  "demoDataWarning": "Algunos datos son de demostración. Conecta tus cuentas para análisis reales."
}
```

---

## Flujo de Datos Mejorado

```
┌─────────────────────────────────────────────┐
│   CommandConsole (Usuario escribe mensaje)  │
└────────────────────┬────────────────────────┘
                     │
                     ├─ Fetch OmnichannelMetrics
                     │  (Meta + Google + TikTok)
                     │
                     ▼
        ┌─────────────────────────────┐
        │  omnichannelMetrics object  │
        │ (platforms + consolidated)  │
        └────────────────┬────────────┘
                         │
                         ▼
        ┌─────────────────────────────┐
        │  disruptivaa-agent function │
        │  (recibe omnichannelMetrics)│
        └────────────────┬────────────┘
                         │
        ┌────────────────┴──────────────┐
        │ Construir contexto omnicanal  │
        │ (tabla + métricas reales)     │
        │                               │
        │ "Meta: CPA=$45 vs Google:$52" │
        │ "Sugiero mover 15% presupuesto"
        └────────────────┬──────────────┘
                         │
                         ▼
        ┌─────────────────────────────┐
        │   Llamar LLM con contexto    │
        │  + OMNICHANNEL_INSTRUCTIONS  │
        └────────────────┬────────────┘
                         │
                         ▼
        Respuesta con análisis omnicanal
        + Sugerencias de redistribución
```

---

## Resumen de Cambios

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/hooks/useOmnichannelMetrics.ts` | **Crear** | Hook para reutilizar lógica de fetch omnicanal |
| `src/components/CommandConsole.tsx` | **Modificar** (línea ~175-215) | Agregar fetch de datos omnicanal y pasar al requestBody |
| `supabase/functions/disruptivaa-agent/index.ts` | **Modificar** (línea ~597, 675-750) | Recibir omnichannelMetrics, construir contexto, incluir en prompt |
| `src/i18n/locales/es/common.json` | **Modificar** | Agregar claves faltantes si existen |
| `src/i18n/locales/en/common.json` | **Modificar** | Agregar claves faltantes si existen |
| `src/i18n/locales/pt/common.json` | **Modificar** | Agregar claves faltantes si existen |

---

## Verificación Post-Implementación

- [ ] El Dashboard muestra OmnichannelPerformance con los 3 KPIs correctos
- [ ] TikTok siempre muestra "Demo Data" en el badge
- [ ] Al hacer una pregunta al agente, incluye análisis omnicanal (tabla Meta vs Google vs TikTok)
- [ ] El agente sugiere redistribuciones de presupuesto con números concretos
- [ ] Los labels cambian correctamente al cambiar idioma (EN/PT)
- [ ] No hay errores de red al hacer fetch de las 3 plataformas en paralelo

