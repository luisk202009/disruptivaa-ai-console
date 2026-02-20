

# Tarea 4.5 Final: Sistema de Autenticacion White-Label

## Resumen

Completar el flujo de autenticacion con Magic Link, restablecimiento de contrasena con vistas dedicadas, y consistencia de branding en redirecciones.

## Cambios Planificados

### 1. Magic Link en Login

**Archivo**: `src/components/AuthForm.tsx`

- Agregar una tercera pestana/seccion "Entrar sin contrasena" debajo del formulario de login
- Implementar `signInWithOtp({ email, options: { emailRedirectTo } })` de Supabase
- El boton muestra un estado de carga y un toast de exito indicando que se envio el enlace
- La URL de redireccion apunta a `window.location.origin` (que en produccion seria `app.disruptivaa.com`)

Nota: El diseno del email enviado por Supabase Auth se configura en Supabase Dashboard > Authentication > Email Templates. El Admin Email Manager ya existente genera el HTML que se debe pegar alli.

### 2. Restablecimiento de Contrasena - Vista de Solicitud

**Archivo**: `src/components/AuthForm.tsx`

- Agregar un enlace "Olvidaste tu contrasena?" debajo del formulario de login
- Al hacer clic, mostrar un formulario inline (o alternar vista) con campo de email y boton "Enviar enlace"
- Llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/update-password' })`

**Archivo**: `src/pages/Settings.tsx`

- Actualizar `redirectTo` de `/auth` a `/update-password` para consistencia

### 3. Vista `/update-password`

**Archivo nuevo**: `src/pages/UpdatePassword.tsx`

- Pagina publica (no protegida) que se muestra cuando el usuario llega desde el enlace de recuperacion
- Supabase inyecta los tokens en el hash de la URL; el `onAuthStateChange` con evento `PASSWORD_RECOVERY` los detecta automaticamente
- Muestra un formulario con campo "Nueva contrasena" y "Confirmar contrasena"
- Al enviar, llama a `supabase.auth.updateUser({ password })`
- Tras exito, redirige a `/` con toast "Contrasena actualizada correctamente"
- Estilo consistente con la pagina de Auth (fondo oscuro, logo centrado, contenedor con borde sutil)

**Archivo**: `src/App.tsx`

- Agregar ruta `/update-password` apuntando a `UpdatePassword` (ruta publica, sin ProtectedRoute)

### 4. Consistencia de Branding en Redirecciones

**Archivo**: `src/components/AuthForm.tsx`

- En `signUp`, cambiar `emailRedirectTo` de `window.location.origin + '/'` a `window.location.origin` (ya correcto)
- En Magic Link, usar `window.location.origin` como redirect

**Archivo**: `src/pages/Settings.tsx`

- Cambiar `redirectTo` a `window.location.origin + '/update-password'`

Nota sobre produccion: Cuando el dominio `app.disruptivaa.com` este configurado, `window.location.origin` automaticamente apuntara al dominio correcto. No se hardcodea ningun dominio.

### 5. i18n - Nuevas claves

**Archivos**: `src/i18n/locales/[es|en|pt]/common.json`

Nuevas claves en la seccion `auth`:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `auth.magicLink` | Entrar sin contrasena | Sign in without password | Entrar sem senha |
| `auth.magicLinkSent` | Enlace enviado a tu email | Link sent to your email | Link enviado para seu email |
| `auth.magicLinkDesc` | Te enviaremos un enlace de acceso directo | We'll send you a direct access link | Enviaremos um link de acesso direto |
| `auth.forgotPassword` | Olvidaste tu contrasena? | Forgot your password? | Esqueceu sua senha? |
| `auth.sendResetLink` | Enviar enlace de recuperacion | Send recovery link | Enviar link de recuperacao |
| `auth.resetLinkSent` | Enlace de recuperacion enviado | Recovery link sent | Link de recuperacao enviado |
| `auth.newPassword` | Nueva contrasena | New password | Nova senha |
| `auth.confirmPassword` | Confirmar contrasena | Confirm password | Confirmar senha |
| `auth.updatePassword` | Actualizar contrasena | Update password | Atualizar senha |
| `auth.passwordUpdated` | Contrasena actualizada correctamente | Password updated successfully | Senha atualizada com sucesso |
| `auth.passwordMismatch` | Las contrasenas no coinciden | Passwords don't match | As senhas nao coincidem |
| `auth.backToLogin` | Volver al login | Back to login | Voltar ao login |

## Archivos Afectados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/components/AuthForm.tsx` | Edicion | Magic Link, forgot password link, i18n |
| `src/pages/UpdatePassword.tsx` | Nuevo | Vista de cambio de contrasena |
| `src/App.tsx` | Edicion | Nueva ruta /update-password |
| `src/pages/Settings.tsx` | Edicion | Corregir redirectTo |
| `src/i18n/locales/es/common.json` | Edicion | 12 nuevas claves |
| `src/i18n/locales/en/common.json` | Edicion | 12 nuevas claves |
| `src/i18n/locales/pt/common.json` | Edicion | 12 nuevas claves |

## Notas

- El `VerificationBanner` ya esta implementado y funcional en `Index.tsx`
- El registro ya hace auto-login (Supabase crea sesion inmediata con `signUp`)
- El flujo de onboarding post-registro ya existe en `Index.tsx` (redirige a `CompanyOnboarding` si `company_id` es null)
- No se requieren migraciones de base de datos
- No se requieren cambios en Edge Functions
- El diseno del email de Magic Link y Recovery se configura en Supabase Dashboard; el Admin Email Manager existente genera el HTML para copiar

