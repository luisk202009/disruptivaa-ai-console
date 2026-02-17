

# Plan: Estabilizacion Masiva Sprint 6

## Resumen

Seis correcciones criticas: fix de visibilidad admin, onboarding robusto, motor de suscripciones, edicion de perfil con nombre completo, sidebar admin, y toggle de promocion/demotion de admin.

---

## Migraciones de Base de Datos (2 migraciones)

### Migracion 1: Agregar `full_name` a `profiles`

```sql
ALTER TABLE public.profiles ADD COLUMN full_name text;
```

Esto permite mostrar nombres en la tabla de usuarios del admin y editarlos en Settings.

### Migracion 2: Politica INSERT en `companies` para usuarios autenticados

Actualmente, solo admins pueden insertar empresas. El flujo de onboarding (usuarios no-admin creando su empresa) falla silenciosamente por RLS. Se necesita:

```sql
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);
```

Sin esta politica, el `CompanyOnboarding` da error al intentar crear la empresa.

---

## Cambios por Archivo

### 1. `src/pages/AdminDashboard.tsx` — Reestructuracion completa

**Usuarios tab:**
- Cambiar columna "ID" por "Nombre" mostrando `profile.full_name` (o email truncado como fallback)
- Necesita hacer join con `auth.users` para obtener email — como no podemos consultar `auth.users` desde el cliente, usaremos `full_name` del perfil y el ID truncado como fallback
- Agregar toggle Switch (en vez de solo boton) para promover/revocar admin: al activar inserta en `user_roles`, al desactivar elimina de `user_roles`

**Suscripciones tab (nuevo — reemplaza "Planes"):**
- Renombrar tab "Planes" a "Suscripciones"
- Mantener la tabla de planes mock existente
- Agregar seccion "Generar Enlace de Pago" debajo:
  - Select de Empresa (del listado de `companies`)
  - Select de Plan (Mensual/Anual con precios mock)
  - Boton "Generar Enlace" que genera un link simulado (`https://checkout.stripe.com/mock/...`) y lo copia al clipboard
  - Badge "Simulado" indicando que Stripe no esta conectado aun
- Definir estados de suscripcion como constantes: `pending`, `active`, `expired`, `canceled`

### 2. `src/pages/Settings.tsx` — Campo "Nombre Completo"

- Agregar un campo Input editable "Nombre Completo" debajo del email
- Estado local `fullName` inicializado con `profile?.full_name` o `user.user_metadata?.full_name`
- Boton "Guardar" que ejecuta `handleUpdateProfile`:
  1. `supabase.auth.updateUser({ data: { full_name: value } })` — actualiza metadata de Auth
  2. `supabase.from('profiles').update({ full_name: value }).eq('id', user.id)` — actualiza tabla profiles
  3. Invalida query `['profile']`
  4. Toast de confirmacion

### 3. `src/pages/Index.tsx` — Onboarding obligatorio (ya implementado, verificar)

El codigo actual ya bloquea correctamente:
```typescript
const needsOnboarding = dataReady && user && !isAdmin && !profile?.company_id;
if (needsOnboarding && !showLoading) return <CompanyOnboarding />;
```
Solo necesita confirmar que el loading state evita el flash del dashboard. **Sin cambios necesarios.**

### 4. `src/components/Sidebar.tsx` — Admin en dropdown (ya implementado)

El Panel Admin ya esta en el dropdown del footer, condicionado a `isAdmin`, encima de "Conexiones". **Sin cambios necesarios.**

### 5. `src/hooks/useUserProfile.ts` — Agregar `full_name` al tipo

- Agregar `full_name: string | null` a la interfaz `UserProfile`
- Agregar mutacion `updateFullName` que actualice tanto auth metadata como profiles

### 6. Traducciones (es, en, pt)

Nuevas claves:
| Clave | ES | EN |
|-------|----|----|
| `settings.fullName` | Nombre completo | Full name |
| `settings.fullNamePlaceholder` | Ej: Juan Perez | E.g.: John Doe |
| `settings.profileUpdated` | Perfil actualizado | Profile updated |
| `settings.profileError` | Error al actualizar perfil | Error updating profile |
| `admin.subscriptions` | Suscripciones | Subscriptions |
| `admin.generateLink` | Generar Enlace de Pago | Generate Payment Link |
| `admin.selectCompany` | Seleccionar empresa | Select company |
| `admin.selectPlan` | Seleccionar plan | Select plan |
| `admin.monthly` | Mensual | Monthly |
| `admin.annual` | Anual | Annual |
| `admin.linkGenerated` | Enlace copiado al portapapeles | Link copied to clipboard |
| `admin.linkMock` | Enlace simulado — sin conexion a Stripe | Mock link — no Stripe connection |
| `admin.revokeAdmin` | Revocar Admin | Revoke Admin |
| `admin.revoked` | Rol de admin revocado | Admin role revoked |
| `admin.userName` | Nombre | Name |
| `admin.subscriptionStates` | Estados: pending, active, expired, canceled | States: pending, active, expired, canceled |

---

## Secuencia de Implementacion

1. Migracion SQL: agregar `full_name` a profiles + INSERT policy en companies
2. Actualizar `useUserProfile.ts` (tipo + mutacion)
3. Actualizar `Settings.tsx` (campo nombre completo)
4. Reestructurar `AdminDashboard.tsx` (nombre en usuarios, switch admin, tab suscripciones)
5. Agregar traducciones (es, en, pt)

---

## Notas Tecnicas

- **RLS critico**: Sin la politica INSERT en `companies`, el onboarding falla para usuarios no-admin. Esta es la correccion mas urgente.
- **Toggle admin**: El switch usa INSERT para promover y DELETE para revocar en `user_roles`. La politica "Admins can manage all roles" (ALL) ya cubre ambas operaciones.
- **`full_name` dual**: Se almacena tanto en `auth.users.user_metadata` (para que `getUserDisplayName()` del Sidebar lo muestre inmediatamente) como en `profiles.full_name` (para que el admin pueda verlo en la tabla de usuarios).
- **Stripe mock**: El enlace generado es puramente visual. Cuando se habilite Stripe, se reemplazara por una llamada real a `create-checkout-session`.

