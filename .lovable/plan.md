

# Plan: Separacion de Dashboard (Widgets) y Agentes AI (Interaccion)

## Resumen

Reorganizar la navegacion para que el Dashboard (`/`) sea una vista puramente analitica con widgets de rendimiento, y la pagina de Agentes AI (`/agents`) sea el centro de mando con la consola de chat completa.

---

## Arquitectura Actual vs. Propuesta

```text
ACTUAL:
  / (Dashboard)  -> OmnichannelPerformance + Chat + Selector de Agentes
  /agents        -> Catalogo de agentes (solo cards, redirige a / para chatear)

PROPUESTO:
  / (Dashboard)  -> OmnichannelPerformance + Widget Metas + Widget Actividad + Widget Conectividad
  /agents        -> "Que quieres hacer hoy?" + Selector de Agentes + Consola de Chat completa
```

---

## Cambios Detallados

### 1. Transformar `src/components/Dashboard.tsx` en Vista Analitica

**Eliminar:**
- Todo el estado y logica de chat (`isChatActive`, `activeChatId`, `selectedAgent`, `handleCommand`, etc.)
- Componente `CommandConsole` y sus dos instancias
- Selector de agentes (botones de agent cards)
- Titulo "Que quieres hacer hoy?"
- Event listeners de `newConversation`, `loadConversation`, `userLoggedOut`

**Mantener:**
- Header con avatar/sign-in
- `OmnichannelPerformance` (ya existe)
- `AuthModal`
- Import de `DISRUPTIVAA_AGENTS` (se mantiene export para uso en Agents.tsx)

**Agregar 3 nuevos widgets:**

a) **Widget Estado de Metas** - Componente inline que muestra un resumen de `project_goals` del primer proyecto del usuario (o un mensaje para crear uno). Usa `useProjects` + `useProjectGoals` para obtener datos. Muestra nombre del proyecto, cantidad de metas cumplidas vs total, con indicadores de color.

b) **Widget Actividad Reciente** - Muestra las ultimas 3-5 recomendaciones del agente (ultimos mensajes de rol `assistant` de `agent_messages`). Cada item con titulo truncado, fecha relativa, y link para cargar la conversacion.

c) **Widget Conectividad** - Muestra el estado de las 3 plataformas (Meta, Google, TikTok) con indicadores verde/gris. Usa `useIntegrations` para verificar el estado. Boton "Gestionar" que navega a `/connections`.

### 2. Transformar `src/pages/Agents.tsx` en Centro de Mando

**Eliminar:**
- El catalogo actual de agent cards con grid layout
- La logica de redireccion a `/` con `selectedAgentId`

**Reemplazar con:**
- Toda la logica de chat que estaba en `Dashboard.tsx`:
  - Estado: `selectedAgent`, `isChatActive`, `activeChatId`, `showAuthModal`
  - Hooks: `useAgents`, `useMessages`, `useAuth`
  - Funciones: `handleCommand`, `handleSelectAgent`, `handleClearAgent`, `handleConsoleFocus`
  - Event listeners: `newConversation`, `loadConversation`, `userLoggedOut`
- UI: Titulo "Que quieres hacer hoy?", CommandConsole, selector de agentes (mismo layout que tenia Dashboard)
- Ya incluye `Sidebar` (no necesita cambios de layout)

### 3. Actualizar Sidebar Event Listeners

**Archivo:** `src/components/Sidebar.tsx`

- `handleNewConversation`: Cambiar `navigate("/")` a `navigate("/agents")`
- `handleLoadConversation`: Cambiar `navigate("/")` a `navigate("/agents")`

Esto asegura que al hacer clic en una conversacion reciente, el usuario llegue a la consola de chat en `/agents`.

### 4. Actualizar Navegacion en Otros Componentes

- `src/components/CommandConsole.tsx`: Importa `DISRUPTIVAA_AGENTS` de `Dashboard.tsx`. Esto seguira funcionando sin cambios porque el export se mantiene.
- `src/App.tsx`: Sin cambios necesarios en rutas.

### 5. Crear Widgets Nuevos para Dashboard

**a) `src/components/dashboard/GoalsSummaryWidget.tsx`**
- Consulta `useProjects` para obtener el primer proyecto
- Consulta `useProjectGoals` para obtener metas
- Muestra: nombre del proyecto, X/Y metas cumplidas, barra de progreso
- Si no hay proyectos: "Crea un proyecto para establecer metas"
- Link "Ver detalles" navega a `/project/:id`

**b) `src/components/dashboard/RecentActivityWidget.tsx`**
- Consulta directa a `agent_messages` (ultimos 5, rol=assistant)
- Muestra: texto truncado (80 chars), fecha relativa con `date-fns`
- Click en item navega a `/agents` y dispara `loadConversation`

**c) `src/components/dashboard/ConnectivityWidget.tsx`**
- Usa `useIntegrations` para estado de Meta, Google, TikTok
- 3 filas con icono de plataforma, nombre, badge verde/gris
- Boton "Gestionar conexiones" navega a `/connections`

### 6. Actualizar Traducciones (ES, EN, PT)

Nuevas claves:

```json
{
  "dashboardWidgets": {
    "goalsTitle": "Estado de Metas",
    "goalsEmpty": "Crea un proyecto para establecer metas",
    "goalsProgress": "{{achieved}} de {{total}} metas cumplidas",
    "viewDetails": "Ver detalles",
    "activityTitle": "Actividad Reciente",
    "activityEmpty": "Aun no hay recomendaciones de los agentes",
    "connectivityTitle": "Conectividad",
    "connected": "Conectado",
    "disconnected": "No conectado",
    "manageConnections": "Gestionar conexiones",
    "welcomeTitle": "Panel de Control",
    "welcomeSubtitle": "Resumen de tu rendimiento de marketing"
  }
}
```

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/Dashboard.tsx` | **Reescribir** | Eliminar chat, agregar 3 widgets analiticos |
| `src/pages/Agents.tsx` | **Reescribir** | Mover logica de chat completa aqui |
| `src/components/Sidebar.tsx` | **Modificar** | Cambiar navegacion de conversaciones a `/agents` |
| `src/components/dashboard/GoalsSummaryWidget.tsx` | **Crear** | Widget de resumen de metas |
| `src/components/dashboard/RecentActivityWidget.tsx` | **Crear** | Widget de actividad reciente |
| `src/components/dashboard/ConnectivityWidget.tsx` | **Crear** | Widget de estado de APIs |
| `src/i18n/locales/es/common.json` | **Modificar** | Agregar claves dashboardWidgets |
| `src/i18n/locales/en/common.json` | **Modificar** | Agregar claves dashboardWidgets |
| `src/i18n/locales/pt/common.json` | **Modificar** | Agregar claves dashboardWidgets |

---

## Flujo del Usuario Post-Cambio

```text
1. Usuario entra a / (Dashboard)
   -> Ve OmnichannelPerformance (KPIs consolidados)
   -> Ve Estado de Metas (proyecto principal)
   -> Ve Actividad Reciente (ultimas recomendaciones IA)
   -> Ve Conectividad (Meta, Google, TikTok)

2. Usuario hace clic en "Agentes AI" en sidebar
   -> Llega a /agents con "Que quieres hacer hoy?"
   -> Selecciona agente o escribe directamente
   -> Chat se activa en pantalla completa

3. Usuario hace clic en conversacion reciente en sidebar
   -> Navega a /agents y carga la conversacion
```

---

## Verificacion Post-Implementacion

- [ ] Dashboard (/) muestra solo widgets analiticos, sin chat
- [ ] Agentes AI (/agents) tiene la consola de chat completa funcionando
- [ ] Seleccionar un agente en /agents inicia el chat correctamente
- [ ] Click en conversacion reciente en sidebar navega a /agents y carga el chat
- [ ] Los 3 widgets nuevos muestran datos correctos (o estados vacios apropiados)
- [ ] Todo el UI esta traducido en ES, EN y PT
- [ ] El componente OmnichannelPerformance sigue visible en el Dashboard

