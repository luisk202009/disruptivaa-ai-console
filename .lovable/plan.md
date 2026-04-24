## Plan: Lista de espera + invitación con 1 año gratis

### Resumen

Desactivar la opción pública de "Registrarse". En su lugar, mostrar un formulario de **lista de espera** que escribe en la tabla `leads` con `status='waitlist'`. El **login sigue activo** para los usuarios ya invitados. Cuando un admin pulsa "Invitar" en `/admin/leads`, además del magic link, se crea automáticamente una **suscripción gratuita de 12 meses** vinculada a su empresa una vez completen el onboarding.

---

### 1. Frontend: ocultar registro y reemplazarlo por waitlist

**`src/components/AuthForm.tsx`**
- Eliminar el `<Tab>` "Registrarse" y todo el bloque `TabsContent value="register"` (incluido `handleRegister`).
- Quitar el botón de Magic Link público (queda solo para invitados que lo soliciten desde "¿Olvidaste tu contraseña?").
- El formulario muestra únicamente: email + contraseña + "¿Olvidaste tu contraseña?".
- Debajo del form, añadir nota discreta: *"¿Aún no tienes acceso? Únete a la lista de espera"* → link a `/lista-de-espera`.

**`src/components/AuthModal.tsx`**
- Cambiar `defaultTab="register"` → cambiar todo el copy del modal: en vez de invitar a crear cuenta, redirigir a `/lista-de-espera` con un único botón primario *"Únete a la lista de espera"* + link secundario *"Ya tengo acceso → Iniciar sesión"*.
- El componente queda como un "gating modal" que dirige a waitlist.

**`src/pages/Auth.tsx`**
- Sin cambios estructurales: solo refleja el `AuthForm` recortado (login-only). Subtítulo cambia a *"Accede con tu cuenta de Disruptivaa"*.

**Eliminar/actualizar CTAs de "Registrarse" o "Sign up":**
- `src/components/Dashboard.tsx` línea 170: el botón `/auth?tab=register` → `/lista-de-espera`.
- `src/components/landing/Navbar.tsx`: el botón "Agendar llamada" se mantiene; añadir badge sutil *"Lista de espera abierta"* opcional. El link "Log In" se conserva.
- `src/components/PricingPlans.tsx` línea 145: los CTAs de planes pagos redirigen a `/lista-de-espera` en vez de `/auth?tab=register`.
- `src/pages/WhatsAppLinkGenerator.tsx` línea 223: el `<Link to="/auth">` que invita a registrarse para guardar links → cambiar a `/lista-de-espera`.
- `src/pages/Agents.tsx` línea 203: idem.

---

### 2. Nueva página pública `/lista-de-espera`

**`src/pages/Waitlist.tsx`** (nueva)
- Layout con `PublicLayout` (Navbar + Footer).
- Hero corto: *"Únete a la lista de espera de Disruptivaa"* + subtítulo explicando la propuesta de valor: **acceso anticipado + 1 año de servicio sin costo** para los seleccionados.
- Formulario con validación zod:
  - `name` (required, 2–100)
  - `email` (required, email válido)
  - `company` (required, 2–100)
  - `service_type` (select required): Marketing & Ads, CRM HubSpot, MVP / Aplicaciones, Shopify, Otro
  - `notes` (opcional, textarea 0–500): *"Cuéntanos brevemente qué necesitas"*.
- Submit → llama a la RPC existente `upsert_lead_and_brief` con `service_type` y `answers={ notes, source: 'waitlist' }`, y luego un `update` que fija `status='waitlist'`.
- Estado de éxito: tarjeta con confirmación *"¡Estás en la lista! Te avisaremos por email cuando se libere tu cupo."* + botón secundario para volver a la home.

**Ruta en `src/App.tsx`**: añadir `<Route path="/lista-de-espera" element={<Lazy><Waitlist /></Lazy>} />` antes del catch-all.

---

### 3. Base de datos: nuevo estado `waitlist` y plan gratuito

**Migración:**
1. Añadir `'waitlist'` y `'invitado'` a los valores de `leads.status` (no es enum, basta documentarlo y filtrarlo en UI).
2. Insertar plan en `plans`:
   ```sql
   INSERT INTO plans (name, price, currency, max_projects, max_goals_per_project,
                      max_ai_agents, max_dashboards, max_integrations, is_active)
   VALUES ('Waitlist Free Year', 0, 'USD', 5, -1, -1, 3, -1, true);
   ```
   (Equivale a un plan intermedio entre Starter y Growth, sin precio.)
3. Sin cambios de schema en `subscriptions` (ya soporta `expires_at` y `plan_id`).

---

### 4. Backend: invitación + suscripción automática

**`supabase/functions/invite-lead-user/index.ts`** (modificar)

Nuevo flujo tras `inviteUserByEmail`:
1. Marcar lead con `status='invitado'` (en vez de `'cliente'`, que se reserva para clientes pagos reales).
2. Buscar el `user_id` del invitado en `auth.users` por email (usando `adminClient.auth.admin.listUsers` o equivalente).
3. Si el usuario aún no tiene `company_id` en `profiles` → guardar la intención en una tabla puente `pending_waitlist_grants` con `email`, `lead_id`, `granted_at`. La suscripción se crea cuando el usuario complete el onboarding (paso 5).
4. Si ya tiene `company_id` (caso edge: re-invitación) → insertar directamente la suscripción gratuita con:
   - `plan_name = 'Waitlist Free Year'`
   - `plan_id` = id del plan creado
   - `price = 0`, `currency = 'USD'`
   - `status = 'active'`
   - `starts_at = now()`
   - `expires_at = now() + interval '1 year'`

**Nueva tabla `pending_waitlist_grants`:**
```sql
CREATE TABLE public.pending_waitlist_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  lead_id uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);
ALTER TABLE pending_waitlist_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage waitlist grants" ON pending_waitlist_grants
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
```

---

### 5. Aplicar la suscripción al completar onboarding

**`src/components/CompanyOnboarding.tsx`** (modificar)

Después de que `create_company_for_user` retorna el `company_id`:
- Llamar a una nueva edge function `apply-waitlist-grant` que:
  1. Verifica si existe un registro en `pending_waitlist_grants` para el email del usuario actual y `applied_at IS NULL`.
  2. Si existe → inserta la `subscription` gratuita de 1 año vinculada al `company_id` recién creado.
  3. Marca `applied_at = now()` en `pending_waitlist_grants`.
- El usuario entra al dashboard ya con suscripción activa (sin pasar por el paywall `SubscriptionPending`).

---

### 6. UX en `/admin/leads`

**`src/pages/AdminLeads.tsx`** (modificar)
- Añadir `'waitlist'` e `'invitado'` a `statusOptions` y `statusColors` (waitlist = morado/violeta, invitado = ámbar).
- El botón "Invitar" sigue funcional. Tras éxito, el toast cambia a: *"Invitación enviada · 1 año gratis activado al registrarse"*.
- Filtro por defecto opcional: `waitlist` para priorizar la cola.

---

### Archivos

| Archivo | Acción |
|---|---|
| `src/components/AuthForm.tsx` | Modificar (quitar registro) |
| `src/components/AuthModal.tsx` | Modificar (redirigir a waitlist) |
| `src/pages/Auth.tsx` | Modificar (copy login-only) |
| `src/pages/Waitlist.tsx` | Crear |
| `src/App.tsx` | Modificar (ruta `/lista-de-espera`) |
| `src/components/Dashboard.tsx` | Modificar (CTA) |
| `src/components/PricingPlans.tsx` | Modificar (CTA) |
| `src/pages/WhatsAppLinkGenerator.tsx` | Modificar (CTA) |
| `src/pages/Agents.tsx` | Modificar (CTA) |
| `src/pages/AdminLeads.tsx` | Modificar (estados waitlist/invitado) |
| `src/components/CompanyOnboarding.tsx` | Modificar (aplicar grant) |
| `supabase/functions/invite-lead-user/index.ts` | Modificar (registrar grant) |
| `supabase/functions/apply-waitlist-grant/index.ts` | Crear |
| Migración SQL | Crear (tabla `pending_waitlist_grants` + plan `Waitlist Free Year`) |

### Consideraciones

- **Login intacto**: usuarios ya creados (admin, clientes existentes) entran sin cambios.
- **Idempotencia**: `pending_waitlist_grants.email` con `UNIQUE` evita duplicados; `apply-waitlist-grant` valida `applied_at IS NULL`.
- **Privacidad**: el grant se aplica desde edge function con service role; el cliente solo dispara la llamada.
- **Rollback**: para reabrir registro público, basta restaurar el tab "Registrarse" en `AuthForm` y los CTAs originales.
