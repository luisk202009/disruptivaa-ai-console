

# Plan: TikTok Ads Demo + Dashboard Omnicanal + Inteligencia 360

## Alcance Ajustado

El usuario prefiere omitir la implementacion completa de OAuth para TikTok por ahora. Se enfocara en:
- TikTok conectado en modo demo (ya existe `fetch-tiktok-ads-metrics` con datos demo)
- Nuevo componente `OmnichannelPerformance` con vista consolidada de 3 plataformas
- Inteligencia del agente mejorada para sugerencias de redistribucion de presupuesto
- Traducciones completas ES/EN/PT

---

## Cambios a Implementar

### 1. Crear `src/components/OmnichannelPerformance.tsx`

Componente que muestra una vista consolidada de rendimiento de las 3 plataformas.

**Funcionalidad:**
- Llama a los 3 edge functions de metricas (`fetch-meta-metrics`, `fetch-google-ads-metrics`, `fetch-tiktok-ads-metrics`) para obtener Spend, Clicks, Impressions, CPC, CTR y Conversions
- Muestra 3 KPIs consolidados en la parte superior:
  - Gasto Total (suma de las 3 plataformas)
  - CPA Combinado (gasto total / conversiones totales)
  - ROAS Promedio (si hay datos de conversiones con valor)
- Grafico de barras comparativo (usando Recharts, ya instalado) mostrando inversion por plataforma
- Cada barra con el color de la plataforma (Meta: #1877F2, Google: #4285F4, TikTok: #EF7911)
- Indicador de datos demo cuando no hay conexion real

**Props:**
```typescript
interface OmnichannelPerformanceProps {
  datePreset?: DatePreset;
}
```

**Datos a obtener por plataforma:**
- spend (gasto)
- clicks
- impressions
- cpc
- conversions

El componente usara `supabase.auth.getSession()` para autenticar las llamadas a los edge functions.

### 2. Integrar en `src/pages/Index.tsx` o `src/components/Dashboard.tsx`

Colocar el componente `OmnichannelPerformance` encima del chat del Dashboard (cuando no hay chat activo), o como una seccion visible antes de seleccionar un agente.

**Decision de ubicacion:** Agregar como seccion colapsable en la pantalla principal (Index) visible cuando el usuario esta autenticado y no tiene un chat activo. Esto le da una vista rapida del rendimiento antes de interactuar con los agentes.

En `Dashboard.tsx`, se mostrara el componente solo cuando:
- El usuario esta autenticado
- No hay un chat activo (`!isChatActive`)
- Remplazara o acompanara la zona de seleccion de agentes

### 3. Actualizar Inteligencia del Agente para Redistribucion de Presupuesto

**Archivo:** `supabase/functions/disruptivaa-agent/index.ts`

Enriquecer las instrucciones omnicanal (`OMNICHANNEL_INSTRUCTIONS`) para incluir logica de redistribucion de presupuesto explicita:

```
- Si CPA de TikTok es >15% menor que Google Ads, sugerir mover 10-15% del presupuesto
- Si ROAS de una plataforma es >30% superior, recomendar incrementar inversion alli
- Si CTR de una plataforma es <50% del promedio, sugerir pausar o reevaluar creatividades
- Incluir estimacion del impacto: "Moviendo $X de Google a TikTok podrias generar ~Y conversiones adicionales"
```

Estas instrucciones ya existen parcialmente en `OMNICHANNEL_INSTRUCTIONS` pero se enriquecerian con umbrales concretos y ejemplos de sugerencias con numeros.

### 4. Actualizar Traducciones

**Nuevas claves en los 3 idiomas para el componente omnicanal:**

ES:
```json
{
  "omnichannel": {
    "title": "Rendimiento Omnicanal",
    "totalSpend": "Gasto Total",
    "combinedCPA": "CPA Combinado",
    "avgROAS": "ROAS Promedio",
    "spendByPlatform": "Inversión por Plataforma",
    "noData": "Conecta al menos una plataforma para ver métricas consolidadas.",
    "demoData": "Datos de demostración",
    "metaAds": "Meta Ads",
    "googleAds": "Google Ads",
    "tiktokAds": "TikTok Ads",
    "loading": "Cargando métricas...",
    "period": "Período"
  }
}
```

EN:
```json
{
  "omnichannel": {
    "title": "Omnichannel Performance",
    "totalSpend": "Total Spend",
    "combinedCPA": "Combined CPA",
    "avgROAS": "Avg ROAS",
    "spendByPlatform": "Spend by Platform",
    "noData": "Connect at least one platform to see consolidated metrics.",
    "demoData": "Demo data",
    "metaAds": "Meta Ads",
    "googleAds": "Google Ads",
    "tiktokAds": "TikTok Ads",
    "loading": "Loading metrics...",
    "period": "Period"
  }
}
```

PT:
```json
{
  "omnichannel": {
    "title": "Desempenho Omnicanal",
    "totalSpend": "Gasto Total",
    "combinedCPA": "CPA Combinado",
    "avgROAS": "ROAS Médio",
    "spendByPlatform": "Investimento por Plataforma",
    "noData": "Conecte pelo menos uma plataforma para ver métricas consolidadas.",
    "demoData": "Dados de demonstração",
    "metaAds": "Meta Ads",
    "googleAds": "Google Ads",
    "tiktokAds": "TikTok Ads",
    "loading": "Carregando métricas...",
    "period": "Período"
  }
}
```

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/OmnichannelPerformance.tsx` | **Crear** | Vista consolidada de 3 plataformas con KPIs y grafico de barras |
| `src/components/Dashboard.tsx` | **Modificar** | Integrar OmnichannelPerformance cuando no hay chat activo |
| `supabase/functions/disruptivaa-agent/index.ts` | **Modificar** | Enriquecer OMNICHANNEL_INSTRUCTIONS con logica de redistribucion |
| `src/i18n/locales/es/common.json` | **Modificar** | Agregar claves omnichannel |
| `src/i18n/locales/en/common.json` | **Modificar** | Agregar claves omnichannel |
| `src/i18n/locales/pt/common.json` | **Modificar** | Agregar claves omnichannel |

---

## Nota sobre TikTok OAuth

Se omite por ahora la creacion de `tiktok-oauth-exchange` y `TikTokCallback.tsx`. El edge function `fetch-tiktok-ads-metrics` ya existe y devuelve datos demo cuando no hay token real. Cuando el usuario tenga credenciales TikTok (App ID / Secret), se implementara el flujo OAuth completo siguiendo el patron de Meta/Google.

---

## Verificacion Post-Implementacion

- [ ] El componente OmnichannelPerformance se muestra en la pantalla principal para usuarios autenticados
- [ ] Los 3 KPIs (Gasto Total, CPA Combinado, ROAS) se calculan correctamente
- [ ] El grafico de barras muestra la inversion por plataforma con colores correctos
- [ ] El agente sugiere redistribucion de presupuesto cuando detecta diferencias >20% entre plataformas
- [ ] Todas las etiquetas estan traducidas en ES, EN y PT
- [ ] Los datos demo se muestran correctamente cuando no hay conexiones reales

