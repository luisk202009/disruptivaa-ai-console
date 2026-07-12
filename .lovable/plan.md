# Flujo de suscripción sin fricción desde /pricing

## Problema
Actualmente al pulsar "Suscribirse" en `/pricing`, la mutación `subscribe` bloquea con el error *"Necesitas completar el onboarding de tu empresa antes de suscribirte"* si `profile.company_id` es null. Esto rompe el flujo público: el usuario debería poder elegir plan → registrarse → onboarding → checkout de forma continua.

## Objetivo
El botón "Suscribirse" (y "Reclamar oferta") debe funcionar como un embudo guiado:

1. **Usuario NO autenticado** → redirige a `/auth?plan=<id>&next=checkout`
2. **Usuario autenticado sin `company_id`** → redirige a onboarding con `?plan=<id>&next=checkout`
3. **Usuario autenticado con `company_id`** → dispara Stripe Checkout como hoy

Tras completar el paso pendiente, el sistema reanuda automáticamente el checkout del plan elegido.

## Cambios

### 1. `src/components/PricingPlans.tsx`
- Reemplazar la validación bloqueante dentro de `subscribe.mutationFn` por lógica de ruteo en `handleSubscribe`:
  - Si no hay `session` → `navigate('/auth?plan=<id>&next=checkout')`.
  - Si hay sesión pero `!profile?.company_id` → `navigate('/dashboard?onboarding=1&plan=<id>&next=checkout')` (Dashboard ya monta `CompanyOnboarding` cuando falta empresa).
  - Si todo está listo → `subscribe.mutate(plan)`.
- Aplicar la misma lógica al CTA del bloque Waitlist Free Year ("Reclamar oferta").
- Eliminar el `throw new Error("Necesitas completar el onboarding...")` de la mutación.

### 2. `src/pages/Auth.tsx`
- Leer `plan` y `next` de `useSearchParams`.
- Al pasar `onSuccess` a `<AuthForm>`, redirigir a `/dashboard?onboarding=1&plan=<id>&next=checkout` en lugar de `/dashboard`. Si no hay `plan`, comportamiento actual.

### 3. `src/components/CompanyOnboarding.tsx` (o donde se cierre el onboarding)
- Tras guardar la empresa exitosamente, leer `plan` y `next` de la URL. Si `next === "checkout"` y hay `plan`, invocar el mismo edge function `create-checkout-session` y redirigir a `data.url`. Si falla, dejar al usuario en el dashboard con un toast.

### 4. `src/pages/Dashboard.tsx` (o el layout que monta el onboarding)
- Asegurar que si el usuario llega con `?onboarding=1` y no tiene `company_id`, se abre el flujo de onboarding automáticamente (probablemente ya sucede porque se muestra cuando falta `company_id`; solo verificar).

## Aspectos técnicos
- No se toca el edge function `create-checkout-session` — sigue exigiendo `company_id`, lo cual está correcto (validación de servidor).
- El parámetro `next=checkout` es la señal única que dispara el reanude post-onboarding y post-login.
- El plan Waitlist Free Year se comporta igual: primero login/onboarding, luego se ejecuta su rama especial (que hoy también llama a Stripe con `stripe_price_id=null` — a corregir en otra iteración si aplica; fuera del alcance).

## Fuera de alcance
- Configurar `stripe_price_id` reales en la tabla `plans` (Starter/Growth/Enterprise) — si aún no existen, el checkout fallará con el mensaje real de Stripe, que ya se muestra al usuario.
- Rediseño del onboarding.
