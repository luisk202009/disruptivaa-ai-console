## Objetivo

1. Solucionar el error "Error al iniciar el pago. Intenta de nuevo." al pulsar **Suscribirse** en `/pricing`.
2. Rediseñar la sección para mostrar únicamente **3 planes** en la parrilla principal (Starter, Growth, Enterprise).
3. Mover **Waitlist Free Year** debajo, como una **oferta destacada diferenciada** (banner/oferta especial, no una tarjeta más).

---

## 1) Diagnóstico del error de pago

La toast `"Error al iniciar el pago"` proviene de `PricingPlans.tsx → subscribe.onError`. El fallo puede venir de:

- La invocación de la Edge Function `create-checkout-session` devuelve error (por ejemplo, `STRIPE_SECRET_KEY` no configurada, `stripe_price_id` inválido, o falta de `company_id` en el perfil).
- El `insert` en `subscriptions` falla por RLS o por columnas requeridas.
- Para planes sin `stripe_price_id` (como Waitlist Free Year o Enterprise sin precio en Stripe) el flujo actual crea suscripción "pending" pero puede fallar en el insert.

**Acciones:**

- Añadir logs detallados en el `catch` del mutation y mostrar el mensaje real (`err.message`) en la toast para depurar.
- En la Edge Function `create-checkout-session`, mejorar mensajes de error devueltos (ya existen), y confirmar que `STRIPE_SECRET_KEY` está configurada como secret. Si no lo está, guiar al usuario para configurarla.
- Manejar el caso "usuario sin `company_id`" (usuarios sin onboarding completado): en lugar de fallar, redirigir a completar el onboarding o al waitlist.
- Para planes sin `stripe_price_id`, en lugar de crear una suscripción pending silenciosa, redirigir a `/lista-de-espera?plan=ID` (más coherente con el estado actual del negocio).

Confirmaré con el usuario si `STRIPE_SECRET_KEY` está configurado antes de asumir la causa raíz.

---

## 2) Rediseño de `/pricing`

### Parrilla principal — 3 planes

Filtrar los planes activos excluyendo el "Waitlist Free Year" (por nombre o marcándolo con un flag). Mostrar en grid de 3 columnas los planes de pago: **Starter**, **Growth**, **Enterprise**. Mantener el badge "Popular" en Growth (el central).

### Oferta destacada — Waitlist Free Year

Debajo de la parrilla, un bloque **full-width diferenciado**:

- Fondo con gradiente sutil (primary/emerald) y borde luminoso.
- Etiqueta "Oferta especial · Tiempo limitado".
- Título: "Waitlist Free Year — 1 año gratis por unirte temprano".
- Descripción breve de beneficios y límites (5 proyectos, ilimitados agentes IA, 3 paneles, integraciones ilimitadas).
- CTA prominente: **"Únete a la lista de espera"** → `/lista-de-espera?plan=<id>`.
- Layout horizontal (título + beneficios a la izquierda, CTA a la derecha) para diferenciarlo visualmente de las tarjetas.

---

## Detalles técnicos

**Archivos a modificar:**

- `src/components/PricingPlans.tsx`
  - Separar `plans` en `paidPlans` (grid de 3) y `waitlistPlan` (destacado abajo).
  - Filtro: `plan.name.toLowerCase().includes("waitlist")` o `price === 0`.
  - Mejorar `onError` mostrando `err.message` real.
  - Para planes sin `stripe_price_id`, navegar directo a `/lista-de-espera` en lugar de insertar suscripción pendiente.
- `src/pages/Pricing.tsx` — sin cambios estructurales, solo el componente hijo cambia.
- (Opcional según confirmación) `supabase/functions/create-checkout-session/index.ts` — mejor manejo de errores y validación de `STRIPE_SECRET_KEY`.

**Sin cambios en la BD** — el filtrado es en frontend, los planes existentes se mantienen.

---

## Preguntas antes de ejecutar

1. ¿La variable `STRIPE_SECRET_KEY` ya está configurada en los secrets de Supabase? Si no, es la causa más probable del error. ¿Quieres que la configuremos ahora (necesito la clave `sk_live_...` o `sk_test_...`)?  
  
Si ay ae encuentra configurada, verificalo igualmente.
2. Los planes **Starter ($29)**, **Growth ($79)** y **Enterprise ($199)** en la BD, ¿ya tienen `stripe_price_id` reales creados en tu cuenta de Stripe? Si no, el checkout siempre fallará hasta que existan.  
  
Si, estan los stripe_price_id en la bd  

3. Para el bloque **Waitlist Free Year**, ¿el CTA debe llevar a `/lista-de-espera` (formulario) o directo a registro/auth?  
  
Directo al registro Auth.  
  
