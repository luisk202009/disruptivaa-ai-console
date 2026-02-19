

# Sprint 8, Tarea 3(B): Motor de Email Branding con Resend

## Prerequisito: API Key de Resend

El secret `RESEND_API_KEY` **no existe** actualmente en el proyecto. Antes de implementar, se solicitara al usuario que proporcione su API Key de Resend (obtenible en https://resend.com/api-keys). Tambien se necesita confirmar el dominio verificado en Resend para el campo `from` (por defecto se usara `onboarding@resend.dev` si no hay dominio propio configurado).

## Arquitectura

```text
stripe-webhook (evento checkout.session.completed)
  └── fetch interno a send-branded-email
        └── Resend API (POST https://api.resend.com/emails)
              └── Email HTML con branding dinamico
```

## Cambios Planificados

### 1. Nueva Edge Function: `supabase/functions/send-branded-email/index.ts`

**Payload esperado:**
```json
{
  "to": "cliente@email.com",
  "subject": "Pago confirmado",
  "templateName": "payment_success" | "welcome" | "support",
  "variables": {
    "clientName": "Luis K",
    "logoUrl": "https://...",
    "brandColor": "#00A3FF",
    "lang": "es"
  }
}
```

**Logica:**
- Lee `RESEND_API_KEY` de `Deno.env`
- Selecciona plantilla HTML segun `templateName`
- Inyecta variables dinamicas (nombre, logo, color, textos i18n segun `lang`)
- Envia via `POST https://api.resend.com/emails`
- `from`: `"Disruptivaa <no-reply@disruptivaa.com>"` (configurable)
- En caso de error, registra en tabla `ai_agent_logs` para auditoria

**Plantilla HTML premium:**
- Fondo `#000000`, texto `#FFFFFF`
- Tipografia: stack de Fira Sans via Google Fonts (con fallbacks system)
- Logo del cliente centrado arriba
- Boton de accion principal con `brand_color` dinamico
- Diseno responsivo (max-width 600px, padding adaptivo)
- Footer con enlace a soporte

**Templates incluidos:**
| templateName | Uso |
|---|---|
| `welcome` | Bienvenida tras registro |
| `payment_success` | Confirmacion de pago exitoso |
| `support` | Mensaje de soporte/contacto |

### 2. Modificacion: `supabase/functions/stripe-webhook/index.ts`

En el case `checkout.session.completed`, despues de activar la suscripcion y crear la notificacion:

1. Obtener el email y nombre del usuario desde `profiles` usando el `company_id`
2. Obtener el `branding_color` de la empresa desde `companies`
3. Obtener el idioma preferido del usuario desde `profiles.language`
4. Hacer un `fetch` interno a `send-branded-email` con los datos

```typescript
// Despues de la notificacion existente...
const { data: userProfile } = await supabase
  .from("profiles")
  .select("id, full_name, language")
  .eq("company_id", companyId)
  .limit(1)
  .maybeSingle();

const { data: userAuth } = await supabase.auth.admin.getUserById(userProfile.id);

const { data: company } = await supabase
  .from("companies")
  .select("name, branding_color")
  .eq("id", companyId)
  .maybeSingle();

await fetch(`${supabaseUrl}/functions/v1/send-branded-email`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${serviceRoleKey}`
  },
  body: JSON.stringify({
    to: userAuth.user.email,
    subject: "Pago confirmado - Disruptivaa",
    templateName: "payment_success",
    variables: {
      clientName: userProfile.full_name || "Cliente",
      logoUrl: "",  // Logo de Disruptivaa por defecto
      brandColor: company?.branding_color || "#00A3FF",
      lang: userProfile.language || "es"
    }
  })
});
```

El error del email no debe bloquear la respuesta del webhook (wrapped en try/catch).

### 3. Configuracion en `supabase/config.toml`

Agregar la nueva funcion:
```toml
[functions.send-branded-email]
verify_jwt = false
```

### 4. i18n: Nuevas claves para emails

Dado que los emails se generan server-side (edge function), las traducciones se embeben directamente en la funcion como un objeto de traducciones (no se puede importar los JSON del frontend en Deno). Se creara un mapa inline:

```typescript
const emailTranslations = {
  es: {
    welcome: { heading: "Bienvenido a Disruptivaa", body: "Tu cuenta ha sido creada...", cta: "Ir al Dashboard" },
    payment_success: { heading: "Pago Exitoso", body: "Tu pago ha sido confirmado...", cta: "Ver mi cuenta" },
    support: { heading: "Soporte Disruptivaa", body: "Estamos aqui para ayudarte...", cta: "Contactar Soporte" }
  },
  en: {
    welcome: { heading: "Welcome to Disruptivaa", body: "Your account has been created...", cta: "Go to Dashboard" },
    payment_success: { heading: "Payment Successful", body: "Your payment has been confirmed...", cta: "View my account" },
    support: { heading: "Disruptivaa Support", body: "We're here to help...", cta: "Contact Support" }
  },
  pt: {
    welcome: { heading: "Bem-vindo ao Disruptivaa", body: "Sua conta foi criada...", cta: "Ir ao Painel" },
    payment_success: { heading: "Pagamento Confirmado", body: "Seu pagamento foi confirmado...", cta: "Ver minha conta" },
    support: { heading: "Suporte Disruptivaa", body: "Estamos aqui para ajudar...", cta: "Contatar Suporte" }
  }
};
```

### 5. Manejo de Errores

- Si `RESEND_API_KEY` no esta configurado: log error + retornar 500
- Si Resend retorna error: capturar respuesta, loguear en `ai_agent_logs` con `action_type: "email_send_error"` y retornar el error al caller
- En `stripe-webhook`: el fetch a `send-branded-email` esta envuelto en try/catch para que un fallo de email **nunca** bloquee la respuesta 200 al webhook de Stripe

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/send-branded-email/index.ts` | **NUEVO** — Motor de email con Resend + plantillas HTML |
| `supabase/functions/stripe-webhook/index.ts` | Agregar llamada a `send-branded-email` tras pago exitoso |
| `supabase/config.toml` | Registrar nueva funcion |

## Seguridad

- `RESEND_API_KEY` almacenado como secret de Supabase (nunca en codigo)
- La funcion acepta llamadas autenticadas (service role) desde otras edge functions
- No se expone informacion sensible en logs (solo IDs y status codes)

## Paso Previo Requerido

Antes de implementar, se solicitara al usuario la API Key de Resend mediante la herramienta `add_secret`. El usuario debe:
1. Crear cuenta en https://resend.com
2. Obtener su API Key en https://resend.com/api-keys
3. (Opcional) Verificar un dominio propio para enviar desde `@su-dominio.com`

