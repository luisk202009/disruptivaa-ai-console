

# Fix Criticos de Autenticacion - Fase Final Tarea 4.5

## Resumen

Corregir el bucle de login con Magic Link, manejar errores 429, agregar plantilla "Magic Link" al Admin Email Manager, y asegurar transiciones fluidas en el splash screen.

## 1. Fix del Bucle de Login (Magic Link)

**Archivo**: `src/contexts/AuthContext.tsx`

El problema: cuando un usuario llega desde un Magic Link, Supabase procesa los tokens del hash de la URL y dispara `SIGNED_IN`. Pero si el hash no se limpia, puede haber un loop. Ademas, si el usuario esta en `/auth`, no se redirige automaticamente al dashboard.

Solucion:
- Detectar en `onAuthStateChange` cuando el evento es `SIGNED_IN` y la URL contiene tokens de hash (`#access_token` o parametros tipo `type=magiclink`)
- Limpiar el hash de la URL con `window.history.replaceState`
- Si la ruta actual es `/auth` o `/update-password`, forzar redireccion a `/` usando `window.location.href = '/'`
- No usar `setTimeout` ni `navigate()` (ya que el context no tiene acceso al router), sino `window.location` para garantizar un reload limpio

Cambio concreto en el listener:
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  setLoading(false);
  
  if (event === 'SIGNED_IN' && session) {
    // Limpiar tokens del hash si existen
    if (window.location.hash && window.location.hash.includes('access_token')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    // Redirigir si estamos en /auth
    if (window.location.pathname === '/auth') {
      window.location.href = '/';
    }
  }
});
```

## 2. Manejo de Error 429 (Rate Limit)

**Archivo**: `src/components/AuthForm.tsx`

Agregar deteccion de error 429 en los tres handlers de autenticacion:

- `handleLogin`: verificar `error.status === 429` o `error.message?.includes('rate limit')`
- `handleMagicLink`: misma logica
- `handleForgotPassword`: misma logica

Mensaje amigable: "Demasiados intentos. Por favor, espera unos minutos antes de volver a intentarlo."

Se extraera una funcion auxiliar `getAuthErrorMessage(error)` para centralizar la logica de mensajes de error y evitar repeticion.

## 3. Admin Email Manager - Plantilla Magic Link

**Archivo**: `src/pages/AdminDashboard.tsx`

- Agregar `"magiclink"` como tercera opcion en el `Select` de plantillas, con label `t("admin.emailMagicLink")`
- Actualizar el placeholder del campo `emailSubject` para incluir el caso magiclink: "Tu enlace de acceso"
- Actualizar el placeholder del campo `emailBody` para incluir `{{ .ConfirmationURL }}` como variable obligatoria
- Agregar un aviso visible debajo del textarea cuando la plantilla es "magiclink" o "confirmation" recordando que `{{ .ConfirmationURL }}` es requerido

## 4. Mejoras en UpdatePassword

**Archivo**: `src/pages/UpdatePassword.tsx`

La pagina actual ya esta funcional. Ajustes menores:
- Mejorar el manejo del evento `PASSWORD_RECOVERY`: el `setReady(true)` incondicional en linea 27 es correcto (Supabase procesa los tokens del hash automaticamente)
- Agregar manejo de error 429 al `handleSubmit`
- Tras exito, limpiar hash de la URL antes de redirigir

## 5. i18n - Nuevas claves

**Archivos**: `src/i18n/locales/[es|en|pt]/common.json`

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `auth.rateLimitError` | Demasiados intentos. Espera unos minutos. | Too many attempts. Wait a few minutes. | Muitas tentativas. Aguarde alguns minutos. |
| `admin.emailMagicLink` | Magic Link | Magic Link | Magic Link |

## Archivos Afectados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/contexts/AuthContext.tsx` | Edicion | Limpiar hash URL y redirigir en Magic Link |
| `src/components/AuthForm.tsx` | Edicion | Manejo error 429, funcion auxiliar de errores |
| `src/pages/AdminDashboard.tsx` | Edicion | Agregar opcion "Magic Link" al selector |
| `src/pages/UpdatePassword.tsx` | Edicion | Manejo error 429, limpiar hash |
| `src/i18n/locales/es/common.json` | Edicion | 2 nuevas claves |
| `src/i18n/locales/en/common.json` | Edicion | 2 nuevas claves |
| `src/i18n/locales/pt/common.json` | Edicion | 2 nuevas claves |

## Notas

- El splash screen ya muestra "Estrategia Digital y Automatizaciones" correctamente (verificado en `LoadingScreen.tsx`)
- La animacion `logo-pulse` ya esta aplicada al logo
- No se requieren migraciones de base de datos
- No se requieren cambios en Edge Functions
- El flujo `/update-password` ya existe y funciona; solo se agregan mejoras menores de robustez

