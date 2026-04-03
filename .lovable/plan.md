

## Plan: Módulo de Planes con Límites de Funcionalidades

### Contexto actual

Actualmente los planes son solo strings hardcodeados ("Starter", "Growth", "Enterprise") en `AdminSubscriptions.tsx`. No existe una tabla de planes ni límites de funcionalidades. Stripe está integrado vía webhook para procesar pagos y activar suscripciones, y esa lógica se mantiene — los planes definen **qué puede hacer** cada empresa, y las suscripciones vinculan una empresa a un plan.

### Arquitectura propuesta

```text
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    plans     │──────▶│  subscriptions   │◀──────│  companies   │
│ (límites)    │  FK   │  (plan_id)       │  FK   │              │
└──────────────┘       └──────────────────┘       └──────────────┘
                              │
                        useSubscription hook
                              │
                        usePlanLimits hook ← enforcement en frontend
```

### 1. Migración SQL — Tabla `plans` + vincular a `subscriptions`

```sql
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  max_projects integer DEFAULT -1,        -- -1 = ilimitado
  max_goals_per_project integer DEFAULT -1,
  max_ai_agents integer DEFAULT -1,
  max_dashboards integer DEFAULT -1,
  max_integrations integer DEFAULT -1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: admins full access, authenticated users can read active plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access" ON plans FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active plans" ON plans FOR SELECT TO authenticated
  USING (is_active = true);

-- Add plan_id FK to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN plan_id uuid REFERENCES plans(id);

-- Seed default plans
INSERT INTO plans (name, max_projects, max_goals_per_project, max_ai_agents, max_dashboards, max_integrations)
VALUES
  ('Starter', 2, 3, 1, 1, 1),
  ('Growth', 10, 10, 3, 5, 3),
  ('Enterprise', -1, -1, -1, -1, -1);
```

### 2. Nueva página: `src/pages/admin/AdminPlans.tsx`

Tabla con todos los planes mostrando: nombre, límites por columna, estado activo/inactivo.

Formulario para crear/editar un plan con campos:
- Nombre del plan
- Máx. proyectos
- Máx. metas por proyecto
- Máx. agentes de IA
- Máx. paneles (dashboards)
- Máx. integraciones (fuentes conectadas)
- Activo (switch)

Cada fila tiene botón "Editar" que abre el formulario con los valores pre-llenados.

### 3. Modificar `AdminSubscriptions.tsx`

- Reemplazar el `PLAN_OPTIONS` hardcodeado por un query a la tabla `plans`
- Al crear suscripción, guardar también `plan_id` junto con `plan_name`
- Mostrar el nombre del plan en la tabla de suscripciones

### 4. Hook `usePlanLimits`

Nuevo hook que:
1. Lee la suscripción activa de la empresa (via `useSubscription`)
2. Busca el plan asociado via `plan_id`
3. Expone funciones como `canCreateProject()`, `canAddGoal(projectId)`, `canConnectIntegration()`, etc.
4. Cuenta los recursos actuales del usuario y los compara con los límites del plan

### 5. Modificar `AdminLayout.tsx`

Agregar "Planes" al grupo "Administración":
```
{ id: "plans", icon: <Crown size={18} />, label: "Planes", path: "/admin/plans" }
```

### 6. Ruta en `App.tsx`

Agregar `/admin/plans` → `AdminPlans` con `AdminLayout`.

### 7. Modificar `useSubscription.ts`

Extender el query para hacer join con `plans` y devolver los límites del plan activo junto con la suscripción.

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| Migración SQL | Tabla `plans`, FK en `subscriptions`, seed data |
| `src/pages/admin/AdminPlans.tsx` | Nueva página CRUD de planes |
| `src/hooks/usePlanLimits.ts` | Hook de enforcement de límites |
| `src/hooks/useSubscription.ts` | Join con `plans` para traer límites |
| `src/pages/admin/AdminSubscriptions.tsx` | Usar planes dinámicos en vez de hardcoded |
| `src/components/admin/AdminLayout.tsx` | Agregar "Planes" al nav |
| `src/App.tsx` | Agregar ruta `/admin/plans` |

### Nota sobre Stripe

La integración con Stripe se mantiene tal cual. Los planes en esta tabla son la **definición interna** de qué límites tiene cada nivel. Stripe sigue procesando el pago y activando la suscripción vía webhook. Opcionalmente en el futuro se puede vincular cada plan a un `stripe_price_id` para automatizar la generación de checkout links.

