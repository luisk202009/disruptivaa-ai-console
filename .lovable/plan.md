
# Consolidacion Tarea 7: Realtime y ajustes visuales

## Resumen

Agregar suscripcion en tiempo real a `ai_agent_logs` en el componente `AgentActivityTimeline` y ajustar el estado vacio para usar el icono `Activity`.

## Cambios

### 1. Suscripcion Realtime en `AgentActivityTimeline.tsx`

Agregar un canal de Supabase Realtime que escuche INSERTs en la tabla `ai_agent_logs`. Cuando llega un nuevo log, se agrega al principio del array local (manteniendo el limite de 50).

Cambios especificos:
- Dentro del `useEffect` existente, despues de `fetchLogs()`, suscribirse al canal `ai_agent_logs` con filtro `INSERT`
- Al recibir un nuevo registro, hacer `setLogs(prev => [newLog, ...prev].slice(0, 50))`
- Limpiar la suscripcion en el return del useEffect

### 2. Ajuste del estado vacio

Cambiar el icono del estado vacio de `Bot` a `Activity` con opacidad reducida para un look mas elegante y coherente con la tematica de actividad.

## Seccion Tecnica

### Codigo de suscripcion Realtime

```typescript
const channel = supabase
  .channel('agent-logs-realtime')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'ai_agent_logs' },
    (payload) => {
      setLogs(prev => [payload.new as AgentLog, ...prev].slice(0, 50));
    }
  )
  .subscribe();

// Cleanup
return () => { supabase.removeChannel(channel); };
```

### Nota sobre Realtime

La tabla `ai_agent_logs` necesita tener Realtime habilitado en Supabase. Se agregara una migracion para ejecutar:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE ai_agent_logs;
```

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/components/AgentActivityTimeline.tsx` | Agregar realtime subscription, cambiar icono estado vacio |
| Nueva migracion SQL | Habilitar realtime en `ai_agent_logs` |
