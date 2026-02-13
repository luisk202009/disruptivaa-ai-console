
# Plan: Simplificar Catálogo de Agentes y Completar Traducción de Títulos

## Estado Actual de Agentes

### Agentes Definidos en `src/components/Dashboard.tsx`
1. smart-brand-architect
2. ghostwriter-pro
3. ads-optimizer
4. ai-crm-sales
5. visual-content-bot

### Objetivo
Eliminar 3 agentes (Smart Brand Architect, GhostWriter Pro, Visual Content Bot) y mantener solo 2 (Ads Optimizer Agent, AI-CRM Sales Bot).

---

## Análisis de Impacto

### Archivo: `src/components/Dashboard.tsx`
- **Líneas 14-145**: Definición del array `DISRUPTIVAA_AGENTS`
  - Eliminar entrada de "smart-brand-architect" (líneas 15-39)
  - Eliminar entrada de "ghostwriter-pro" (líneas 40-64)
  - Mantener entrada de "ads-optimizer" (líneas 65-94)
  - Mantener entrada de "ai-crm-sales" (líneas 95-119)
  - Eliminar entrada de "visual-content-bot" (líneas 120-144)
- **Líneas 178, 233, 269**: Toast messages que usan `agent.name`
  - Estos necesitarán usar traducción para el nombre del agente

### Archivos: Traducción en `src/i18n/locales/[es, en, pt]/agents.json`
- Actualmente tienen 5 agentes
- Eliminar claves para 3 agentes
- Mantener claves para 2 agentes
- La estructura actual ya usa `${agent.id}.name`, `${agent.id}.description`, `${agent.id}.keywords`

### Archivo: `src/pages/Agents.tsx`
- **Línea 56-105**: Loop `DISRUPTIVAA_AGENTS.map()`
  - Automáticamente se ajustará cuando se eliminen del array
  - Ya usa `t()` para nombres y descripciones (líneas 87, 90)

### Archivo: `src/components/CommandConsole.tsx`
- **Línea 309**: Usa `selectedAgent.name` directamente
- **Línea 395**: Usa `selectedAgent.name` directamente
- Estos necesitarán traducción

### Archivo: `supabase/functions/disruptivaa-agent/index.ts`
- **Línea 680**: Validación específica para "ads-optimizer"
- **Línea 557**: Recibe `agentId` del cliente
- No hay validación explícita de agentes permitidos (recomendación agregar)

### Archivos de Traducción Actuales
- `src/i18n/locales/es/agents.json`: Contiene 5 agentes
- `src/i18n/locales/en/agents.json`: Contiene 5 agentes
- `src/i18n/locales/pt/agents.json`: Contiene 5 agentes

---

## Cambios a Implementar

### 1. Actualizar `DISRUPTIVAA_AGENTS` en `src/components/Dashboard.tsx`

**Acción**: Eliminar 3 agentes del array, mantener solo 2.

Resultado:
```typescript
export const DISRUPTIVAA_AGENTS = [
  {
    id: "ads-optimizer",
    dbName: "Ads Optimizer Agent",
    name: "Ads Optimizer Agent",
    // ... resto del objeto
  },
  {
    id: "ai-crm-sales",
    dbName: "AI-CRM Sales Bot",
    name: "AI-CRM Sales Bot",
    // ... resto del objeto
  },
];
```

### 2. Actualizar Archivos de Traducción

**Archivos a Modificar**:
- `src/i18n/locales/es/agents.json`
- `src/i18n/locales/en/agents.json`
- `src/i18n/locales/pt/agents.json`

**Acción**: Eliminar objetos para:
- "smart-brand-architect"
- "ghostwriter-pro"
- "visual-content-bot"

**Mantener solo**:
- "ads-optimizer"
- "ai-crm-sales"

**Ejemplo de resultado para ES**:
```json
{
  "ads-optimizer": {
    "name": "Ads Optimizer Agent",
    "description": "Analista de campañas publicitarias",
    "keywords": ["Meta Ads", "Google Ads", "Optimización"]
  },
  "ai-crm-sales": {
    "name": "AI-CRM Sales Bot",
    "description": "Analista de leads y pipeline",
    "keywords": ["CRM", "Ventas", "Pipeline"]
  }
}
```

### 3. Internacionalizar Names en Toast Messages

**Archivo**: `src/components/Dashboard.tsx`

**Ubicaciones a cambiar**:
- Líneas 178-179: Toast al seleccionar agente (location state)
- Líneas 233-234: Toast al seleccionar agente (click button)
- Líneas 269-270: Toast al detectar agente automáticamente

**Cambio de**:
```typescript
toast({
  title: `${agent.name} seleccionado`,
  description: `Ahora estás hablando con ${agent.name}`,
});
```

**Cambio a**:
```typescript
toast({
  title: t(`${agent.id}.name`, { ns: "agents" }) + " " + t("dashboard.agentSelected", { ns: "common" }),
  description: t("dashboard.nowTalking", { ns: "common", name: t(`${agent.id}.name`, { ns: "agents" }) }),
});
```

O más simple usando nuevas claves genéricas:
```typescript
toast({
  title: t("dashboard.agentSelectedTitle", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
  description: t("dashboard.agentSelectedDesc", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
});
```

**Ubicación al detectar**:
- Líneas 269-270: Cambiar "detectado" a traducción
```typescript
toast({
  title: t("dashboard.agentDetected", { name: t(`${agent.id}.name`, { ns: "agents" }) }),
  description: t("common.processing"),
});
```

### 4. Internacionalizar Names en CommandConsole

**Archivo**: `src/components/CommandConsole.tsx`

**Ubicaciones a cambiar**:
- Línea 309: Usar traducción para nombre del agente
  ```typescript
  // De: Consultando a {selectedAgent.name}
  // A: Consultando a {t(`${selectedAgent.id}.name`, { ns: "agents" })}
  ```

- Línea 395: Usar traducción para nombre del agente
  ```typescript
  // De: {selectedAgent.name} está consultando...
  // A: {t(`${selectedAgent.id}.name`, { ns: "agents" })} está consultando...
  ```

### 5. Añadir Validación en Edge Function

**Archivo**: `supabase/functions/disruptivaa-agent/index.ts`

**Ubicación**: Después de recibir `agentId` (línea 557-559)

**Cambio**: Validar que `agentId` sea uno de los 2 agentes permitidos:
```typescript
const ALLOWED_AGENT_IDS = ["ads-optimizer", "ai-crm-sales"];

if (!ALLOWED_AGENT_IDS.includes(agentId)) {
  return new Response(
    JSON.stringify({ error: "Invalid agent ID" }),
    { status: 400, headers: corsHeaders }
  );
}
```

### 6. Actualizar Claves de Traducción en Common

**Archivos**: `src/i18n/locales/[es, en, pt]/common.json`

**Nuevas claves a agregar**:
```json
{
  "dashboard": {
    "agentSelectedTitle": "{name} seleccionado",
    "agentSelectedDesc": "Ahora estás hablando con {name}",
    "agentDetected": "{name} detectado",
    "consulting": "Consultando a {name}",
    "isConsulting": "{name} está consultando..."
  }
}
```

**Versión en inglés (EN)**:
```json
{
  "dashboard": {
    "agentSelectedTitle": "{name} selected",
    "agentSelectedDesc": "Now talking to {name}",
    "agentDetected": "{name} detected",
    "consulting": "Consulting {name}",
    "isConsulting": "{name} is consulting..."
  }
}
```

**Versión en portugués (PT)**:
```json
{
  "dashboard": {
    "agentSelectedTitle": "{name} selecionado",
    "agentSelectedDesc": "Agora falando com {name}",
    "agentDetected": "{name} detectado",
    "consulting": "Consultando {name}",
    "isConsulting": "{name} está consultando..."
  }
}
```

---

## Resumen de Archivos a Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/components/Dashboard.tsx` | **Modificar** | Eliminar 3 agentes del array, traducir toasts |
| `src/components/CommandConsole.tsx` | **Modificar** | Usar traducción para nombres de agentes |
| `src/i18n/locales/es/agents.json` | **Modificar** | Eliminar 3 agentes, mantener 2 |
| `src/i18n/locales/en/agents.json` | **Modificar** | Eliminar 3 agentes, mantener 2 |
| `src/i18n/locales/pt/agents.json` | **Modificar** | Eliminar 3 agentes, mantener 2 |
| `src/i18n/locales/es/common.json` | **Modificar** | Agregar claves de dashboard |
| `src/i18n/locales/en/common.json` | **Modificar** | Agregar claves de dashboard |
| `src/i18n/locales/pt/common.json` | **Modificar** | Agregar claves de dashboard |
| `supabase/functions/disruptivaa-agent/index.ts` | **Modificar** | Validar agentId permitidos |

---

## Verificación Post-Implementación

- [ ] Solo 2 agentes aparecen en la pantalla principal (Ads Optimizer, AI-CRM Sales Bot)
- [ ] Los nombres de agentes en toasts se muestran en el idioma seleccionado
- [ ] El contexto "Consultando a [nombre]" muestra nombre traducido
- [ ] La página `/agents` solo muestra 2 agentes
- [ ] Cambiar idioma a inglés y portugués verifica que todos los nombres estén traducidos
- [ ] Intentar acceder a agentes eliminados desde URL no causa errores
- [ ] La Edge Function rechaza solicitudes de agentes no permitidos (opcional pero recomendado)

