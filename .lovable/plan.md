
# Ajustes Finales de Auth - Bypass, Debug y Redirect

## Resumen

Tres ajustes concretos: (1) permitir acceso al onboarding sin verificacion de email, (2) logging detallado de errores en Magic Link con fallback, y (3) URL de redireccion de produccion para Magic Link.

## Contexto Importante

No existe una ruta `/onboarding` separada. El wizard de onboarding se renderiza inline en `Index.tsx` cuando `user && !company_id`. El `ProtectedRoute` no protege `/` (Index), asi que los usuarios registrados sin verificar YA pueden acceder al wizard sin problemas. No se requiere crear una ruta nueva.

## 1. ProtectedRoute - Bypass para usuarios sin verificar

**Archivo**: `src/components/ProtectedRoute.tsx`

Actualmente, `ProtectedRoute` solo valida si `user` existe. Esto ya es suficiente porque Supabase crea la sesion inmediatamente al registrarse (aunque `email_confirmed_at` sea null). Sin embargo, para mayor robustez y para el caso futuro donde se quiera forzar verificacion en rutas sensibles, se agregara una prop opcional `requireVerified`:

- Por defecto, `ProtectedRoute` permite acceso a cualquier usuario autenticado (verificado o no) -- comportamiento actual
- No se bloquea a usuarios sin verificar ya que el wizard vive en `/` (ruta publica)

**Cambio concreto**: Ninguno requerido en `ProtectedRoute.tsx` para el caso del wizard. El flujo actual ya funciona correctamente:

```text
Registro -> auto-login -> redirect a / -> Index detecta !company_id -> muestra CompanyOnboarding
```

Sin embargo, para documentar y prevenir regresiones, se agregara un comentario explicativo en ProtectedRoute.

## 2. Debug de Magic Link - Logging detallado y fallback

**Archivo**: `src/components/AuthForm.tsx`

En el handler `handleMagicLink`:

- Agregar `console.error` detallado con el objeto de error completo (status, message, name) para facilitar debug en produccion
- Detectar el error `"identity_provider_not_found"` o `"otp_disabled"` especificamente
- Si ocurre ese error, mostrar un mensaje amigable explicando que el Magic Link no esta disponible y sugiriendo usar contrasena
- Agregar la clave i18n `auth.magicLinkUnavailable` para este caso

```typescript
// En handleMagicLink catch:
console.error('[Magic Link Error]', {
  status: error?.status,
  message: error?.message,
  name: error?.name,
  code: error?.code,
});

if (error?.message?.includes('identity_provider_not_found') || 
    error?.message?.includes('otp_disabled')) {
  toast({
    title: t("auth.magicLinkUnavailable"),
    description: t("auth.magicLinkUnavailableDesc"),
    variant: "destructive"
  });
} else {
  // manejo existente
}
```

## 3. URL de Produccion para Magic Link

**Archivo**: `src/components/AuthForm.tsx`

Cambiar el `emailRedirectTo` en `handleMagicLink` de `window.location.origin` a la URL de produccion explicita:

```typescript
emailRedirectTo: 'https://app.disruptivaa.com/auth'
```

Esto asegura que, independientemente de desde donde se envie el Magic Link (preview, localhost, produccion), el enlace del email siempre apunte al dominio de produccion.

**Nota**: Tambien actualizar `handleForgotPassword` y `handleRegister` con el dominio de produccion para consistencia:

- `handleRegister` -> `emailRedirectTo: 'https://app.disruptivaa.com'`
- `handleForgotPassword` -> `redirectTo: 'https://app.disruptivaa.com/update-password'`

## 4. i18n - Nuevas claves

**Archivos**: `src/i18n/locales/[es|en|pt]/common.json`

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `auth.magicLinkUnavailable` | Magic Link no disponible | Magic Link unavailable | Magic Link indisponivel |
| `auth.magicLinkUnavailableDesc` | Este metodo no esta habilitado. Usa tu contrasena para acceder. | This method is not enabled. Use your password to sign in. | Este metodo nao esta habilitado. Use sua senha para acessar. |

## Archivos Afectados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/components/AuthForm.tsx` | Edicion | Logging, fallback, URLs de produccion |
| `src/i18n/locales/es/common.json` | Edicion | 2 nuevas claves |
| `src/i18n/locales/en/common.json` | Edicion | 2 nuevas claves |
| `src/i18n/locales/pt/common.json` | Edicion | 2 nuevas claves |

## Notas

- No se requieren migraciones de base de datos
- No se requieren cambios en Edge Functions
- El `ProtectedRoute` no necesita cambios ya que el wizard vive en `/` (ruta no protegida)
- Los URLs hardcodeados a `app.disruptivaa.com` son intencionales segun el requerimiento del usuario
