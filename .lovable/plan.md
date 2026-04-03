

## Plan: Página pública de Pricing

### Objetivo

Crear una ruta pública `/pricing` donde cualquier visitante (sin autenticación) pueda ver los planes disponibles con sus precios y límites. Al hacer clic en "Suscribirse", se le redirige a `/auth` para registrarse, y tras autenticarse, el flujo existente de `SubscriptionPending` + Stripe Checkout se activa automáticamente.

### Cambios

#### 1. Nueva página `src/pages/Pricing.tsx`

- Usa `PublicLayout` (navbar + footer existentes)
- Renderiza el componente `PricingPlans` existente pero adaptado: si el usuario no está autenticado, el botón redirige a `/auth?redirect=/dashboard&plan={plan_id}` en vez de llamar a Stripe
- Si está autenticado, comportamiento actual (crear suscripción + checkout)

#### 2. Modificar `PricingPlans.tsx`

- Detectar si hay sesión activa (`useAuth`)
- Sin sesión → botón redirige a `/auth`
- Con sesión → comportamiento actual

#### 3. Ruta en `App.tsx`

- Agregar `/pricing` como ruta pública

#### 4. Opcional: Link en Navbar

- Agregar "Planes" o "Pricing" al navbar público (`src/components/landing/Navbar.tsx`)

### URL resultante

`https://disruptivaa.lovable.app/pricing` (o `https://www.disruptivaa.com/pricing` con dominio custom)

