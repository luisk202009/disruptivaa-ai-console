
# Sprint 8 - Tarea 3: Webhooks de Stripe Reales

## Resumen

Crear una edge function `stripe-webhook` que reciba eventos de Stripe, valide la firma, y actualice la tabla `subscriptions` en tiempo real. Ademas, agregar realtime al hook `useSubscription` para que el paywall se retire automaticamente al confirmar el pago.

## Cambios

### 1. Migracion de Base de Datos

Agregar dos columnas a la tabla `subscriptions`:

- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)

Habilitar Realtime en la tabla `subscriptions` para que el hook pueda reaccionar a cambios.

```text
ALTER TABLE subscriptions ADD COLUMN stripe_customer_id text;
ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id text;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
```

### 2. Secret: STRIPE_WEBHOOK_SECRET

Solicitar al usuario el secreto `STRIPE_WEBHOOK_SECRET` (obtenido desde el Dashboard de Stripe > Webhooks > Signing secret). Este secreto es necesario para validar la firma `stripe-signature` de cada evento.

### 3. Edge Function `stripe-webhook/index.ts`

Crear la funcion en `supabase/functions/stripe-webhook/index.ts`:

**Flujo principal:**

```text
POST /stripe-webhook
  -> Leer body raw + header stripe-signature
  -> Validar firma HMAC-SHA256 con STRIPE_WEBHOOK_SECRET
  -> Parsear evento JSON
  -> Switch por event.type:

    "checkout.session.completed":
      -> Extraer client_reference_id (company_id)
      -> Extraer customer, subscription de la session
      -> UPDATE subscriptions SET status='active',
           stripe_customer_id=customer,
           stripe_subscription_id=subscription
         WHERE company_id = client_reference_id
      -> INSERT notification "Pago confirmado! Tu acceso completo ha sido activado"

    "invoice.payment_failed":
      -> Extraer customer del invoice
      -> UPDATE subscriptions SET status='past_due'
         WHERE stripe_customer_id = customer
      -> INSERT notification de alerta

    "customer.subscription.deleted":
      -> Extraer subscription id
      -> UPDATE subscriptions SET status='canceled'
         WHERE stripe_subscription_id = subscription.id
      -> INSERT notification informativa

  -> Responder 200 OK
```

**Validacion de firma Stripe:**
Se implementara verificacion HMAC-SHA256 manual usando Web Crypto API (compatible con Deno), comparando el hash del payload con la firma del header.

**Configuracion:**
- `verify_jwt = false` en config.toml (los webhooks de Stripe no envian JWT)
- Se usa `SUPABASE_SERVICE_ROLE_KEY` para operaciones de escritura (el webhook no tiene contexto de usuario autenticado)

### 4. Realtime en `useSubscription`

Agregar suscripcion a cambios de Postgres en la tabla `subscriptions` dentro del hook, para que cuando el webhook actualice el status a `active`, el componente `SubscriptionPending` desaparezca automaticamente sin recargar.

**Cambios en el hook:**
- Escuchar `UPDATE` en `subscriptions` filtrado por `company_id`
- Al recibir un cambio, invalidar la query de React Query para refrescar datos

### 5. Traducciones

Agregar claves i18n para las notificaciones generadas por el webhook:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `subscription.paymentConfirmed` | Pago confirmado! Tu acceso ha sido activado | Payment confirmed! Your access has been activated | Pagamento confirmado! Seu acesso foi ativado |
| `subscription.paymentFailed` | Hubo un problema con tu pago | There was a problem with your payment | Houve um problema com seu pagamento |
| `subscription.canceled` | Tu suscripcion ha sido cancelada | Your subscription has been canceled | Sua assinatura foi cancelada |

Nota: Estas traducciones se usan como texto de notificaciones insertadas en la tabla `notifications` desde el webhook. El webhook insertara el texto en espanol por defecto (el idioma se podria determinar por el perfil del usuario en futuras iteraciones).

## Seccion Tecnica

### Verificacion de firma Stripe en Deno

```typescript
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const sig = parts.find(p => p.startsWith('v1='))?.split('=')[1];
  if (!timestamp || !sig) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === sig;
}
```

### Uso de Service Role Key

El webhook opera sin contexto de usuario autenticado. Se usa `SUPABASE_SERVICE_ROLE_KEY` para bypassear RLS y actualizar `subscriptions` y crear `notifications`.

### Realtime en useSubscription

```typescript
useEffect(() => {
  if (!profile?.company_id) return;
  const channel = supabase
    .channel('subscription-realtime')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'subscriptions',
        filter: `company_id=eq.${profile.company_id}` },
      () => { queryClient.invalidateQueries({ queryKey: ['subscription', profile.company_id] }); }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [profile?.company_id]);
```

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| Nueva migracion SQL | Agregar columnas stripe + habilitar realtime |
| `supabase/functions/stripe-webhook/index.ts` | Nuevo: edge function webhook |
| `supabase/config.toml` | Agregar configuracion stripe-webhook |
| `src/hooks/useSubscription.ts` | Agregar realtime subscription |
| `src/i18n/locales/es/common.json` | Agregar traducciones |
| `src/i18n/locales/en/common.json` | Agregar traducciones |
| `src/i18n/locales/pt/common.json` | Agregar traducciones |

## Prerequisitos

- El usuario debe proporcionar el `STRIPE_WEBHOOK_SECRET` desde su Dashboard de Stripe.
- En Stripe, configurar el endpoint del webhook apuntando a: `https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/stripe-webhook`
- Eventos a suscribir en Stripe: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`
