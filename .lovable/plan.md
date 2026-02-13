

# Plan: Smart Alerts basadas en Project Goals

## Resumen

Crear un widget "Centro de Alertas Inteligentes" en el Dashboard que compare automaticamente los valores reales de las APIs contra los objetivos definidos en `project_goals`, generando alertas visuales con niveles de severidad (critica/advertencia/exito).

---

## Arquitectura

```text
project_goals (DB)  +  useGoalMetrics (API data)
         |                      |
         v                      v
   SmartAlerts.tsx  <--- calculo de desviacion
         |
         +--> Alertas visuales en Dashboard
         +--> Contexto inyectado al agente via CommandConsole
```

---

## Cambios Detallados

### 1. Crear `src/hooks/useSmartAlerts.ts`

Hook que encapsula la logica de comparacion entre metas y metricas reales.

**Responsabilidades:**
- Recibe goals de `useProjectGoals` y metricas de `useGoalMetrics`
- Calcula desviacion: `(valorReal - valorMeta) / valorMeta`
- Para metricas inversas (CPA, CPC, spend): desviacion positiva = malo
- Para metricas directas (ROAS, CTR, conversions): desviacion negativa = malo
- Clasifica alertas:
  - **CRITICAL**: desviacion > 25%
  - **WARNING**: desviacion entre 15% y 25%
  - Sin alerta si esta dentro del rango

**Tipo de retorno:**
```typescript
interface SmartAlert {
  id: string;
  metricKey: GoalMetricKey;
  level: "critical" | "warning";
  currentValue: number;
  targetValue: number;
  deviationPercent: number;
  platform: string; // "meta_ads" | "google_ads" | "combined"
  currency: string;
}

interface UseSmartAlertsResult {
  alerts: SmartAlert[];
  loading: boolean;
  isDemo: boolean;
  allClear: boolean; // true si no hay alertas
}
```

### 2. Crear `src/components/dashboard/SmartAlerts.tsx`

Widget visual para el Dashboard.

**UI:**
- Titulo con icono de campana: "Centro de Alertas" (traducido)
- Lista de tarjetas de alerta minimalistas:
  - Borde izquierdo coloreado (rojo = critica, amarillo = advertencia)
  - Icono: AlertTriangle (critica) o AlertCircle (advertencia)
  - Texto: "CPA en Google Ads: $12.50 supera meta ($10.00) en 25%"
  - Texto generado con claves i18n y variables dinamicas
- Estado vacio: "Todos los KPIs estan dentro del rango objetivo" con icono verde CheckCircle
- Estado de carga: skeleton con 2 lineas
- Si no hay proyectos ni metas: no mostrar el widget (return null)

### 3. Integrar en `src/components/Dashboard.tsx`

- Importar SmartAlerts
- Colocarlo entre OmnichannelPerformance y el grid de widgets (posicion prominente)
- Solo visible cuando `user` esta autenticado

```text
OmnichannelPerformance
SmartAlerts          <-- NUEVO
[GoalsSummary | RecentActivity | Connectivity]
```

### 4. Integrar alertas con el Agente AI

**Archivo: `src/components/CommandConsole.tsx`**

- Dentro del bloque donde se construye `requestBody` (linea ~208), agregar campo `activeAlerts`
- Solo para el agente Ads Optimizer
- Pasar array de alertas activas (metricKey, level, currentValue, targetValue, deviationPercent)

**Archivo: `supabase/functions/disruptivaa-agent/index.ts`**

- Extraer `activeAlerts` del body
- Si hay alertas, construir contexto adicional:
  ```
  ALERTAS ACTIVAS:
  - CRITICA: CPA actual $12.50 supera meta $10.00 (+25%)
  - ADVERTENCIA: CTR actual 1.2% por debajo de meta 1.5% (-20%)
  ```
- Inyectar en el system prompt antes del contexto omnicanal

### 5. Traducciones (i18n)

Nuevas claves en `es.json`, `en.json`, `pt.json`:

```json
"smartAlerts": {
  "title": "Centro de Alertas",
  "allClear": "Todos los KPIs estan dentro del rango objetivo.",
  "criticalAbove": "{{metric}} en {{platform}}: El valor actual ({{current}}) supera en {{percent}}% la meta ({{target}}).",
  "criticalBelow": "{{metric}} en {{platform}}: El valor actual ({{current}}) esta {{percent}}% por debajo de la meta ({{target}}).",
  "warningAbove": "{{metric}} en {{platform}}: El valor actual ({{current}}) supera en {{percent}}% la meta ({{target}}).",
  "warningBelow": "{{metric}} en {{platform}}: El valor actual ({{current}}) esta {{percent}}% por debajo de la meta ({{target}}).",
  "demoNote": "Alertas basadas en datos de demostracion",
  "noGoals": "Define metas en un proyecto para activar alertas inteligentes."
}
```

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/hooks/useSmartAlerts.ts` | **Crear** | Hook de logica de comparacion y clasificacion |
| `src/components/dashboard/SmartAlerts.tsx` | **Crear** | Widget visual de alertas |
| `src/components/Dashboard.tsx` | **Modificar** | Integrar SmartAlerts en el layout |
| `src/components/CommandConsole.tsx` | **Modificar** | Pasar alertas activas al requestBody |
| `supabase/functions/disruptivaa-agent/index.ts` | **Modificar** | Recibir y procesar alertas en prompt |
| `src/i18n/locales/es/common.json` | **Modificar** | Agregar claves smartAlerts |
| `src/i18n/locales/en/common.json` | **Modificar** | Agregar claves smartAlerts |
| `src/i18n/locales/pt/common.json` | **Modificar** | Agregar claves smartAlerts |

---

## Verificacion Post-Implementacion

- [ ] Widget de alertas visible en Dashboard cuando hay metas definidas
- [ ] Alertas criticas muestran borde rojo, advertencias borde amarillo
- [ ] Estado "todo bien" muestra mensaje verde cuando KPIs estan en rango
- [ ] Sin metas definidas, el widget no aparece o muestra CTA
- [ ] No hay valores NaN en los porcentajes de desviacion
- [ ] Al preguntar al agente "como van mis campanas", menciona alertas activas
- [ ] Textos traducidos correctamente en EN y PT
