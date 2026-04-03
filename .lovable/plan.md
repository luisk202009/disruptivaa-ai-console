

## Plan: Precio en planes + flujo de pago para usuarios

### Situación actual

- El precio se define manualmente al crear una suscripción en el admin. La tabla `plans` no tiene campo de precio.
- La única forma de crear suscripciones es manualmente desde `/admin/subscriptions`.
- El `generateStripeLink` actual genera un link falso (placeholder), no usa la API real de Stripe.
- El webhook de Stripe ya maneja `checkout.session.completed` para activar suscripciones.

### Cambios propuestos

#### 1. Migración SQL: Agregar precio al plan

Agregar columnas `price` (numeric) y `currency` (text, default 'USD') a la tabla `plans`.

#### 2. Actualizar `AdminPlans.tsx`

Agregar campos de precio y moneda al formulario de creación/edición de planes. Mostrar precio en la tabla.

#### 3. Actualizar `AdminSubscriptions.tsx`

Al seleccionar un plan, auto-rellenar el precio con el del plan. El admin puede editarlo antes de crear la suscripción. Cambio: hacer query de plans con `id, name, price, currency` y al hacer `onValueChange` del select de plan, setear `subPrice` automáticamente.

#### 4. Flujo de pago para usuarios (Stripe Checkout)

Crear una página `/pricing` (o sección dentro del paywall `SubscriptionPending`) donde el usuario bloqueado vea los planes disponibles y pueda iniciar el pago:

- **Nueva página/componente `PricingPlans.tsx`**: Muestra tarjetas con los planes activos, sus límites y precios. Cada plan tiene un botón "Suscribirse".
- **Edge function `create-checkout-session`**: Recibe `plan_id` y `company_id`, crea una Stripe Checkout Session con el precio correspondiente, y devuelve la URL. Usa `client_reference_id = company_id` para que el webhook existente lo vincule.
- Al hacer click en "Suscribirse", se crea una suscripción `pending` en la DB y se redirige al usuario a Stripe Checkout.
- El webhook existente (`checkout.session.completed`) ya activa la suscripción automáticamente.

#### 5. Agregar `stripe_price_id` al plan (opcional pero recomendado)

Para que la edge function pueda crear la sesión de Stripe, cada plan necesita un `stripe_price_id` que el admin configura desde el formulario de planes. Esto vincula el plan interno con un precio creado en el dashboard de Stripe.

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| Migración SQL | `price`, `currency`, `stripe_price_id` en tabla `plans` |
| `AdminPlans.tsx` | Campos precio, moneda y stripe_price_id en formulario |
| `AdminSubscriptions.tsx` | Auto-fill precio al seleccionar plan |
| `PricingPlans.tsx` | Nueva página con tarjetas de planes para usuarios |
| `SubscriptionPending.tsx` | Integrar vista de planes en el paywall |
| `create-checkout-session/index.ts` | Edge function para crear Stripe Checkout Session |
| `App.tsx` | Ruta para pricing si es página separada |
| `useSubscription.ts` | Tipos actualizados |

### Flujo completo

```text
Admin crea plan (con precio + stripe_price_id)
       │
       ├─► Admin crea suscripción manual → precio auto-filled, editable
       │
       └─► Usuario ve paywall → selecciona plan → edge function crea
           Stripe Checkout → usuario paga → webhook activa suscripción
```

### Nota sobre Stripe

Se necesita que cada plan tenga un `stripe_price_id` vinculado a un Product/Price en Stripe. El admin crea el producto en Stripe Dashboard y pega el price ID (`price_xxx`) en el formulario del plan. La edge function usa ese ID para crear la sesión de checkout.

