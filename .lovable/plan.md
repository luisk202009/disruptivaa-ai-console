
# Eliminar el Bloqueo para Nuevos Usuarios sin Suscripcion

## Problema

El usuario `luisk20@gmail.com` tiene empresa asignada (`Luis Carlos Freelance`) pero **no tiene ningun registro en la tabla `subscriptions`**. La logica actual en `Index.tsx` bloquea el acceso cuando:

```
company_id existe AND no hay suscripcion activa
```

Esto significa que cualquier usuario nuevo que complete el onboarding pero aun no tenga suscripcion configurada queda bloqueado inmediatamente.

## Solucion

Cambiar la logica del paywall para que solo bloquee cuando **hay una suscripcion en estado no-activo** (ej: `past_due`, `canceled`, `expired`), no cuando simplemente no existe ninguna suscripcion.

La nueva regla sera:
- Sin registro de suscripcion → acceso libre (usuario nuevo probando la plataforma)
- Suscripcion con status `active` → acceso libre
- Suscripcion con status `past_due`, `canceled`, `expired` → mostrar paywall

## Cambios Tecnicos

### 1. `src/hooks/useSubscription.ts`

Modificar la query para que NO filtre por `status = 'active'`. En su lugar, traer el registro mas reciente y devolver su status, ademas de si esta activa o no:

```
Antes: .eq('status', 'active')  → solo retorna si hay suscripcion activa
Ahora: sin filtro de status     → retorna el registro mas reciente sin importar estado
```

Agregar un nuevo campo `isBlocked` que sea `true` solo cuando hay un registro Y ese registro tiene status diferente de `active`:

```typescript
isBlocked: subscription !== null && subscription.status !== 'active'
```

### 2. `src/pages/Index.tsx`

Cambiar la condicion `needsSubscription` para usar `isBlocked` en lugar de `!hasActiveSubscription`:

```
Antes: needsSubscription = ... && !hasActiveSubscription
Ahora: needsSubscription = ... && isBlocked
```

Esto garantiza:
- Usuario sin suscripcion (nuevo) → `isBlocked = false` → acceso libre
- Usuario con suscripcion activa → `isBlocked = false` → acceso libre
- Usuario con suscripcion cancelada/vencida → `isBlocked = true` → ve el paywall

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useSubscription.ts` | Remover filtro `status=active`, agregar logica `isBlocked` |
| `src/pages/Index.tsx` | Usar `isBlocked` en lugar de `!hasActiveSubscription` |

## Efecto Inmediato

El usuario `luisk20@gmail.com` podra ingresar de inmediato sin necesidad de crear un registro de suscripcion. Cuando en el futuro se establezcan planes y limites por suscripcion, solo habra que asegurarse de que los usuarios con plan activo mantengan `status = 'active'` en su registro.
