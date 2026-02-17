
# Fix: Acceso a Crear Proyectos y Definir Metas para Nuevos Usuarios

## Diagnostico

El usuario `luisk20@gmail.com` tiene **cero proyectos** en la base de datos. La situacion es la siguiente:

**Problema 1 — GoalsSummaryWidget sin CTA:**
El widget "Metas" en el Dashboard muestra el texto vacío `t("dashboardWidgets.goalsEmpty")` pero **no tiene ningun boton ni enlace** para que el usuario cree su primer proyecto. El usuario ve el widget pero no puede hacer nada desde ahi.

**Problema 2 — Proyectos solo accesibles desde /agents tab:**
La creacion de proyectos fue movida a la pestaña "Historial" dentro de `/agents`. Para un usuario nuevo esto no es intuitivo — hay que saber navegar a Agentes > Historial > icono `+` para crear un proyecto.

**Problema 3 — Metas inaccesibles sin proyecto:**
Las metas se definen en `/project/:id` (pagina de detalle). Sin un proyecto existente, el usuario no puede navegar ahi y no sabe como crear uno primero.

## Solucion: Agregar CTAs (llamadas a la accion) claras

### Cambio 1: `src/components/dashboard/GoalsSummaryWidget.tsx`

Cuando no hay proyectos (`!firstProject`), en lugar del texto vacío estatico, mostrar un boton "Crear primer proyecto" que lleve al usuario a `/agents` con la pestaña de historial abierta y el dialogo de creacion activado, **o** simplemente redirigir a `/agents?tab=history&createProject=true`.

La forma mas simple y compatible con la arquitectura actual: navegar a `/agents` con un `state` que indique que se debe abrir el `CreateProjectDialog` automaticamente.

```
Sin proyecto → boton "Nuevo proyecto" → navigate("/agents", { state: { openCreateProject: true } })
Con proyecto sin metas → boton "Definir metas" → navigate(`/project/${firstProject.id}`)
```

### Cambio 2: `src/pages/Agents.tsx`

Leer el `location.state.openCreateProject` al montar el componente y, si es `true`, abrir automaticamente el dialogo `CreateProjectDialog` (setShowCreateProject(true)) y cambiar la tab activa a "history".

### Cambio 3 (opcional pero recomendado): `src/components/Dashboard.tsx`

En la seccion de widgets del Dashboard, cuando el usuario esta autenticado pero no tiene proyectos, mostrar un banner/card de bienvenida que oriente al usuario con un paso a paso simple:
1. Crear un proyecto
2. Definir metas
3. Conectar cuentas publicitarias

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/dashboard/GoalsSummaryWidget.tsx` | Agregar boton CTA cuando no hay proyectos o no hay metas |
| `src/pages/Agents.tsx` | Leer `location.state.openCreateProject` y abrir dialogo automaticamente + activar tab history |

## Flujo Resultante para un Usuario Nuevo

```text
Dashboard (luisk20 entra)
  └── GoalsSummaryWidget muestra "No tienes proyectos aun"
      + boton [Crear proyecto]
          └── navega a /agents con state { openCreateProject: true, activeTab: "history" }
              └── Agents.tsx detecta el state
                  └── activa tab "history" + abre CreateProjectDialog automaticamente
                      └── usuario crea proyecto "Mi Proyecto"
                          └── se redirige a /project/:id
                              └── usuario puede definir metas con ProjectGoalsEditor
```

## Detalles Tecnicos

### GoalsSummaryWidget - Estado sin proyectos
```tsx
// Antes: texto estatico
<p className="text-sm text-muted-foreground">{t("dashboardWidgets.goalsEmpty")}</p>

// Despues: CTA actionable
<p className="text-sm text-muted-foreground mb-3">{t("dashboardWidgets.goalsEmpty")}</p>
<button onClick={() => navigate("/agents", { state: { openCreateProject: true } })}
  className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
  <Plus size={12} /> Crear primer proyecto
</button>
```

### GoalsSummaryWidget - Estado con proyecto pero sin metas
```tsx
// Agregar boton "Definir metas" que lleva a /project/:id
<button onClick={() => navigate(`/project/${firstProject.id}`)}>
  Definir metas →
</button>
```

### Agents.tsx - Leer state y auto-abrir dialogo
```tsx
useEffect(() => {
  if (location.state?.openCreateProject) {
    setActiveTab("history");        // cambiar tab activa
    setShowCreateProject(true);     // abrir dialogo
    window.history.replaceState({}, document.title); // limpiar state
  }
}, [location.state]);
```

Para implementar el cambio de tab programaticamente, se necesita convertir el `Tabs` de `defaultValue="gallery"` a controlado con `value={activeTab}` y `onValueChange={setActiveTab}`.
