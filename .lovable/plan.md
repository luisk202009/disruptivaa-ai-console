
# Plan: Desarrollo de ProjectDetail.tsx y Estado de Salud del Proyecto

## Análisis del Estado Actual

### Ya Implementado (No requiere cambios)

| Componente | Estado | Ubicación |
|------------|--------|-----------|
| Ruta `/project/:id` | ✅ Activa | `App.tsx` línea 39-42 |
| ProjectDetail.tsx | ✅ Funcional | Layout, header con color, grid de conversaciones |
| Navegación en Sidebar | ✅ Funcional | `handleSelectProject` navega a `/project/:id` |
| ProjectGoalsEditor | ✅ Completo | Modal para CRUD de metas |
| useProjectGoals | ✅ Completo | Hook con realtime subscriptions |
| useGoalProgress | ✅ Completo | Cálculo de progreso vs metas |
| GoalTrackerWidget | ✅ Completo | Visualización circular de progreso |

### Pendiente de Implementación

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Layout de dos columnas | ⚠️ Falta | Actualmente es una sola columna |
| ProjectHealthCard | ❌ Falta | Componente de "Estado de Salud" |
| Integración con datos reales | ⚠️ Parcial | Las metas existen, falta comparar con métricas |

---

## Cambios a Implementar

### 1. Nuevo Componente: `ProjectHealthCard.tsx`

**Archivo:** `src/components/projects/ProjectHealthCard.tsx`

**Propósito:** Mostrar un resumen visual del estado de salud del proyecto comparando metas vs rendimiento actual.

**Características:**
- Indicador general de salud (✅ Saludable / ⚠️ Atención / ❌ Crítico)
- Lista de metas con su progreso individual
- Anillos de progreso para cada métrica
- Colores dinámicos según cumplimiento

**Estructura del componente:**
```tsx
interface ProjectHealthCardProps {
  projectId: string;
  projectColor: string;
}

// Renderiza:
// - Título "Estado del Proyecto"
// - Grid de mini-trackers para cada meta
// - Badge de estado general
// - Usa useProjectGoals + datos simulados de rendimiento
```

### 2. Reorganizar Layout de `ProjectDetail.tsx`

**Archivo:** `src/pages/ProjectDetail.tsx`

**Cambio:** De layout de una columna a dos columnas responsivas.

**Estructura actual:**
```text
┌─────────────────────────────────────┐
│ Header (nombre + color + botones)   │
├─────────────────────────────────────┤
│ Objetivos Activos (grid horizontal) │
├─────────────────────────────────────┤
│ Conversaciones (grid 3 columnas)    │
└─────────────────────────────────────┘
```

**Nueva estructura:**
```text
┌─────────────────────────────────────┐
│ Header (nombre + color + botones)   │
├───────────────────┬─────────────────┤
│ Conversaciones    │ Panel Derecho   │
│ (lista scrollable)│ - Salud         │
│                   │ - Metas activas │
│                   │ - Acciones      │
└───────────────────┴─────────────────┘
```

**Clases Tailwind:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Columna izquierda: Conversaciones (2/3) */}
  <div className="lg:col-span-2">
    {/* Grid de conversaciones */}
  </div>
  
  {/* Columna derecha: Panel de KPIs (1/3) */}
  <div className="space-y-6">
    <ProjectHealthCard />
    {/* Metas activas */}
  </div>
</div>
```

### 3. Lógica de Estado de Salud

**Algoritmo de cálculo:**
```typescript
// Por ahora, simulado hasta que haya datos reales conectados
const calculateOverallHealth = (goals: ProjectGoal[]): HealthStatus => {
  if (goals.length === 0) return { status: 'neutral', label: 'Sin metas' };
  
  // Simulación: cuando se integren datos reales de Meta/Google
  // se comparará goal.target_value vs métrica real
  
  const successCount = goals.filter(g => /* real > target */).length;
  const ratio = successCount / goals.length;
  
  if (ratio >= 0.7) return { status: 'healthy', label: 'Saludable', emoji: '✅' };
  if (ratio >= 0.4) return { status: 'warning', label: 'Atención', emoji: '⚠️' };
  return { status: 'critical', label: 'Crítico', emoji: '❌' };
};
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/components/projects/ProjectHealthCard.tsx` | **Crear** | Componente de estado de salud |
| `src/pages/ProjectDetail.tsx` | **Modificar** | Reorganizar a layout de 2 columnas |

---

## Estructura Final de ProjectDetail

```tsx
const ProjectDetail = () => {
  // ... existing hooks ...
  
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-8 bg-background overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header con color del proyecto */}
          <header>...</header>
          
          {/* Layout de dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Columna Izquierda: Conversaciones */}
            <section className="lg:col-span-2">
              <h2>Conversaciones del Proyecto</h2>
              {/* Grid de cards de conversaciones */}
            </section>
            
            {/* Columna Derecha: KPIs y Salud */}
            <aside className="space-y-6">
              {/* Estado de Salud del Proyecto */}
              <ProjectHealthCard 
                projectId={id!}
                projectColor={project.color}
              />
              
              {/* Metas Activas (movido aquí) */}
              <div className="space-y-4">
                {goals.map(goal => (
                  <GoalMiniCard key={goal.id} goal={goal} />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};
```

---

## Diseño Visual del ProjectHealthCard

```text
┌─────────────────────────────────────┐
│ 📊 Estado del Proyecto              │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ ✅  │ │ ⚠️  │ │ ❌  │           │
│  │ CPA │ │ROAS │ │ CTR │           │
│  │$9.50│ │2.8x │ │1.2% │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  Estado General: ⚠️ Atención       │
│  2 de 3 metas cumplidas            │
└─────────────────────────────────────┘
```

---

## Verificación Post-Implementación

- [ ] El layout se adapta correctamente en desktop (2 columnas) y móvil (1 columna)
- [ ] El color del proyecto se refleja en el header y cards
- [ ] Las metas se muestran en el panel derecho con indicadores de progreso
- [ ] El componente de salud muestra el estado general del proyecto
- [ ] Las conversaciones siguen siendo clickeables para navegar al chat
- [ ] El Sidebar navega correctamente a `/project/:id` al hacer clic en un proyecto
