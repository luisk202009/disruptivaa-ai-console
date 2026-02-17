
# Sprint 7 - Tarea 7: Logs de Actividad de Agentes AI

## Resumen

Agregar una tercera pestana "Actividad" en la pagina de Agentes que muestre una linea de tiempo de los ultimos 50 logs de actividad de los agentes AI, usando la tabla `ai_agent_logs` existente.

## Cambios

### 1. Nuevo Componente `AgentActivityTimeline.tsx`

Componente que muestra una linea de tiempo vertical minimalista sobre fondo negro:

- Consulta las ultimas 50 filas de `ai_agent_logs` ordenadas por `created_at` desc
- Cada entrada muestra:
  - Icono segun `result_status` (check para completado, alert para error, activity para en progreso)
  - Descripcion de `action_taken`
  - Fecha/hora relativa usando `date-fns` (`formatDistanceToNow`)
- Los iconos usan el color dinamico de la empresa (`useCompanyBranding`)
- Estado vacio elegante: "Tus agentes estan listos para trabajar"

### 2. Modificacion de `Agents.tsx`

- Agregar una tercera `TabsTrigger` con valor "activity" despues de "history"
- Agregar un `TabsContent` correspondiente que renderice `AgentActivityTimeline`
- Texto de la pestana: `t("agents.tabActivity")`

### 3. Traducciones

Agregar claves en los 3 idiomas (ES/EN/PT):

| Clave | ES | EN | PT |
|-------|-----|-----|-----|
| `agents.tabActivity` | Actividad | Activity | Atividade |
| `agents.noActivity` | Tus agentes estan listos para trabajar | Your agents are ready to work | Seus agentes estao prontos para trabalhar |
| `agents.activityTitle` | Historial de Actividad | Activity History | Historico de Atividade |
| `agents.logStatus.completed` | Completado | Completed | Concluido |
| `agents.logStatus.error` | Error | Error | Erro |
| `agents.logStatus.working` | En progreso | In progress | Em progresso |

## Seccion Tecnica

### Consulta de datos

La tabla `ai_agent_logs` ya existe con RLS de solo lectura para usuarios autenticados. No se requieren cambios de base de datos.

```typescript
const { data } = await supabase
  .from("ai_agent_logs")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(50);
```

### Diseno de la linea de tiempo

Cada entrada se renderiza como una fila con:
- Una linea vertical continua (border-left) conectando las entradas
- Un punto/circulo con el color de la empresa en cada nodo
- Contenido alineado a la derecha del punto

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/components/AgentActivityTimeline.tsx` | Nuevo: componente de linea de tiempo |
| `src/pages/Agents.tsx` | Agregar tercera pestana "Actividad" |
| `src/i18n/locales/es/common.json` | Agregar traducciones |
| `src/i18n/locales/en/common.json` | Agregar traducciones |
| `src/i18n/locales/pt/common.json` | Agregar traducciones |
