

# Tarea 4.5: Ajustes Criticos de Marca y Flujo

## Resumen

Aplicar mejoras de branding en el splash screen, optimizar el flujo de registro con auto-login, agregar un banner de verificacion de email, mejorar la landing para usuarios no logueados con CTAs duales, y crear un modulo de configuracion de emails en el panel de administracion.

## Cambios Planificados

### 1. Splash Screen - Texto y animacion

**Archivo**: `src/components/LoadingScreen.tsx`

- Cambiar `"Inicializando agentes AI..."` por `"Estrategia Digital y Automatizaciones"`
- El logo ya tiene la clase `logo-pulse` y esta centrado -- se verificara que la animacion exista en CSS; si no, se agregara un keyframe de pulso sutil en `src/index.css`

### 2. Flujo de Auth - Auto-login tras registro

**Archivo**: `src/components/AuthForm.tsx`

Supabase por defecto crea una sesion inmediatamente al hacer `signUp` (auto-confirm o si la confirmacion de email esta desactivada). Si la confirmacion de email esta habilitada, el usuario recibe sesion con `email_confirmed_at = null`.

- Modificar `handleRegister` para que, tras un `signUp` exitoso, llame a `onSuccess()` inmediatamente (redirigiendo al dashboard)
- El toast se ajustara a: "Cuenta creada. Verifica tu email para desbloquear todas las funciones"
- El usuario tendra sesion activa (Supabase lo permite) pero con `email_confirmed_at` pendiente

### 3. VerificationBanner - Banner de verificacion de email

**Archivo nuevo**: `src/components/VerificationBanner.tsx`

- Componente que lee `user.email_confirmed_at` del objeto `User` de Supabase
- Se muestra solo si `email_confirmed_at` es `null`
- Estilo: barra fija en la parte superior con fondo `amber-500/10`, borde `amber-500/30`, icono `AlertTriangle`, texto invitando a verificar y un boton "Reenviar email"
- El boton llama a `supabase.auth.resend({ type: 'signup', email: user.email })`

**Archivo**: `src/pages/Index.tsx`
- Integrar `VerificationBanner` dentro del layout principal, antes del contenido del dashboard

**Archivo**: `src/App.tsx`
- Tambien agregar `VerificationBanner` en las rutas protegidas o como componente global despues del `BrandingProvider`

### 4. Landing de acceso - CTAs duales

**Archivo**: `src/components/Dashboard.tsx`

En la seccion `!user` (lineas 154-163), reemplazar el boton unico por dos botones:
- **"Iniciar Sesion"**: Boton Primary (`bg-primary`), navega a `/auth`
- **"Crear Cuenta"**: Boton Outline (`border-primary text-primary`), navega a `/auth` con `defaultTab=register` (usando query param o state)

Se mejorara el mensaje de bienvenida con un titulo mas impactante y la propuesta de valor.

### 5. Admin Email Manager - Nueva pestana

**Archivo**: `src/pages/AdminDashboard.tsx`

Agregar una quinta pestana "Emails" al panel de administracion con:

- **Selector de plantilla**: Dropdown con opciones "Confirmacion de cuenta" y "Recuperacion de contrasena"
- **Campo Asunto**: Input editable para el subject del email
- **Campo HTML Body**: Textarea grande para editar el contenido del cuerpo
- **Boton "Previsualizar"**: Abre un Dialog con un iframe que renderiza el HTML usando el layout dark premium de `send-branded-email` (fondo #000, Fira Sans, logo, color de marca)
- **Boton "Guardar"**: Por ahora muestra un toast informativo indicando que para aplicar estos templates se deben configurar en Supabase Dashboard > Authentication > Email Templates (ya que Supabase gestiona estos emails directamente)

Nota tecnica: Los emails de confirmacion y recuperacion son enviados por Supabase Auth directamente. La configuracion real se hace en el dashboard de Supabase. Este modulo servira como previsualizador y generador del HTML que el admin debe copiar al dashboard de Supabase.

### 6. Stripe Webhook - Verificacion

**Archivo**: `supabase/functions/stripe-webhook/index.ts`

- No se requieren cambios. El endpoint ya esta correctamente configurado con `verify_jwt = false` en `config.toml`
- La URL del webhook es `https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/stripe-webhook`
- El flujo de validacion de firma HMAC-SHA256 ya esta implementado

### 7. i18n - Nuevas claves

**Archivos**: `src/i18n/locales/[es|en|pt]/common.json`

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `auth.verifyEmail` | Verifica tu email para desbloquear todas las funciones | Verify your email to unlock all features | Verifique seu email para desbloquear todos os recursos |
| `auth.resendVerification` | Reenviar email | Resend email | Reenviar email |
| `auth.verificationSent` | Email de verificacion reenviado | Verification email resent | Email de verificacao reenviado |
| `auth.createAccount` | Crear Cuenta | Create Account | Criar Conta |
| `auth.welcomeTitle` | Transforma tu estrategia digital | Transform your digital strategy | Transforme sua estrategia digital |
| `auth.welcomeDescription` | Accede a agentes AI especializados y conecta tus campanas reales | Access specialized AI agents and connect your real campaigns | Acesse agentes de IA especializados e conecte suas campanhas reais |
| `admin.emails` | Emails | Emails | Emails |
| `admin.emailTemplate` | Plantilla de email | Email template | Template de email |
| `admin.emailSubject` | Asunto | Subject | Assunto |
| `admin.emailBody` | Cuerpo HTML | HTML Body | Corpo HTML |
| `admin.emailPreview` | Previsualizar | Preview | Visualizar |
| `admin.emailSave` | Copiar HTML | Copy HTML | Copiar HTML |
| `admin.emailConfirmation` | Confirmacion de cuenta | Account confirmation | Confirmacao de conta |
| `admin.emailRecovery` | Recuperacion de contrasena | Password recovery | Recuperacao de senha |
| `admin.emailCopied` | HTML copiado al portapapeles | HTML copied to clipboard | HTML copiado para a area de transferencia |
| `admin.emailNote` | Pega este HTML en Supabase Dashboard > Authentication > Email Templates | Paste this HTML in Supabase Dashboard > Authentication > Email Templates | Cole este HTML no Supabase Dashboard > Authentication > Email Templates |

## Archivos Afectados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/components/LoadingScreen.tsx` | Edicion | Cambiar texto de carga |
| `src/index.css` | Edicion | Verificar/agregar animacion `logo-pulse` |
| `src/components/AuthForm.tsx` | Edicion | Auto-login tras registro, toast ajustado |
| `src/components/VerificationBanner.tsx` | Nuevo | Banner de verificacion de email |
| `src/components/Dashboard.tsx` | Edicion | CTAs duales para usuarios no logueados |
| `src/pages/Index.tsx` | Edicion | Integrar VerificationBanner |
| `src/pages/AdminDashboard.tsx` | Edicion | Nueva pestana "Emails" con previsualizador |
| `src/i18n/locales/es/common.json` | Edicion | Nuevas claves |
| `src/i18n/locales/en/common.json` | Edicion | Nuevas claves |
| `src/i18n/locales/pt/common.json` | Edicion | Nuevas claves |

## Notas

- No se requieren migraciones de base de datos
- No se requieren cambios en Edge Functions
- El webhook de Stripe ya esta correctamente vinculado y no necesita modificaciones
- La configuracion real de templates de email de Supabase Auth se hace en el dashboard externo; el modulo admin solo genera y previsualiza el HTML

