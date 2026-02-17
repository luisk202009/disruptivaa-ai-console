
# Sprint 7 - Tarea 4: Motor de Suscripciones y Facturacion

## Resumen

Crear una tabla `subscriptions` en Supabase, refactorizar la pestana de suscripciones del Admin Dashboard para gestionar suscripciones reales (CRUD), e implementar un paywall en `Index.tsx` que bloquee el acceso a usuarios sin suscripcion activa.

## Cambios

### 1. Migracion de Base de Datos: Tabla `subscriptions`

Crear la tabla con los siguientes campos:

| Columna | Tipo | Default | Nullable |
|---------|------|---------|----------|
| id | uuid | gen_random_uuid() | No |
| company_id | uuid (FK companies) | - | No |
| plan_name | text | - | No |
| billing_cycle | text | 'monthly' | No |
| price | numeric | - | No |
| currency | text | 'USD' | Yes |
| status | text | 'pending' | No |
| starts_at | timestamptz | now() | No |
| expires_at | timestamptz | - | Yes |
| stripe_link | text | - | Yes |
| created_at | timestamptz | now() | Yes |
| updated_at | timestamptz | now() | Yes |

Politicas RLS:
- Admins: ALL (usando `has_role()`)
- Users: SELECT en suscripciones de su propia empresa (via `profiles.company_id`)

Trigger `update_updated_at_column` en la tabla.

### 2. Hook `useSubscription.ts`

Nuevo hook que:
- Consulta la suscripcion activa de la empresa del usuario actual
- Devuelve `{ subscription, isActive, isLoading }`
- `isActive = subscription?.status === 'active'`
- Usado tanto por el paywall como por otros componentes

### 3. Refactor del Admin Dashboard - Pestana Suscripciones

Reemplazar el contenido mock actual (lineas 370-480) con:

**Tabla de suscripciones existentes**: Lista todas las suscripciones desde la tabla `subscriptions`, mostrando empresa, plan, ciclo, precio, estado y fecha de inicio.

**Badges de estado con colores**:
- `active` -> verde (border-green-500/30, text-green-400)
- `pending` -> amarillo (border-amber-500/30, text-amber-400)
- `expired` -> rojo (border-red-500/30, text-red-400)
- `canceled` -> gris (border-zinc-500/30, text-zinc-400)

**Formulario "Nueva Suscripcion"** (en un card debajo de la tabla):
- Select: Empresa (desde `companies`)
- Select: Plan (Starter / Growth / Enterprise)
- Select: Ciclo (Mensual / Anual)
- Input: Precio
- Input: Fecha de inicio (date picker o input type date)
- Boton "Crear Suscripcion": Inserta el registro en `subscriptions` con status `pending`
- Boton "Generar Enlace de Pago": Genera un link placeholder de Stripe y lo guarda en `stripe_link`

**Acciones por fila**:
- Boton para cambiar estado (dropdown: active, pending, expired, canceled)
- Boton para copiar el enlace de pago

### 4. Paywall en `Index.tsx`

Modificar la logica existente para agregar una tercera condicion de intercepcion:

```text
Flujo actual:
1. Loading -> LoadingScreen
2. needsOnboarding -> CompanyOnboarding
3. Default -> Sidebar + Dashboard

Nuevo flujo:
1. Loading -> LoadingScreen
2. needsOnboarding -> CompanyOnboarding
3. needsSubscription -> SubscriptionPendingView (NUEVO)
4. Default -> Sidebar + Dashboard
```

`needsSubscription` = usuario autenticado, NO admin, tiene company_id, pero NO tiene suscripcion activa.

### 5. Componente `SubscriptionPending.tsx`

Vista simplificada de pantalla completa con:
- Logo de la empresa (si existe)
- Titulo: "Tu suscripcion esta pendiente"
- Subtitulo: "Contacta con soporte para activar tu cuenta"
- Boton "Contactar Soporte" (mailto: o link externo)
- Boton "Cerrar Sesion"
- Fondo negro (#000000), boton con color dinamico de la empresa (`var(--primary-company)`)

### 6. Traducciones

Agregar claves en `es/common.json`, `en/common.json`, `pt/common.json` para:
- `subscription.pending`, `subscription.contactSupport`, `subscription.title`, `subscription.subtitle`
- `admin.newSubscription`, `admin.createSubscription`, `admin.billingCycle`, `admin.price`, `admin.startDate`, `admin.generateStripeLink`, `admin.status`, `admin.plan`

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| Nueva migracion SQL | Crear tabla `subscriptions` con RLS |
| `src/hooks/useSubscription.ts` | Nuevo: hook para consultar suscripcion activa |
| `src/pages/AdminDashboard.tsx` | Refactorizar pestana subscriptions con CRUD real |
| `src/pages/Index.tsx` | Agregar paywall con `useSubscription` |
| `src/components/SubscriptionPending.tsx` | Nuevo: vista de suscripcion pendiente |
| `src/i18n/locales/es/common.json` | Agregar traducciones |
| `src/i18n/locales/en/common.json` | Agregar traducciones |
| `src/i18n/locales/pt/common.json` | Agregar traducciones |

## Consideraciones de seguridad

- Solo admins pueden crear/modificar suscripciones (RLS con `has_role()`)
- Usuarios solo pueden ver la suscripcion de su propia empresa
- El paywall se valida en el frontend; las rutas protegidas ya requieren autenticacion via `ProtectedRoute`
- Los admins NUNCA son bloqueados por el paywall
