

## Plan: Implementacion Real de Google Ads OAuth 2.0

### Resumen

Implementar el flujo completo de OAuth 2.0 para Google Ads siguiendo el patron existente de Meta Ads, incluyendo:
- Edge Function para intercambio de tokens
- Pagina de callback para manejar la respuesta de Google
- Boton de conexion OAuth en la pagina de Conexiones
- Soporte para refresh tokens (requerido por Google)

---

### Fase 1: Secrets Necesarios

Antes de implementar, se necesitan configurar estos secrets en Supabase:

| Secret | Descripcion | Obligatorio |
|--------|-------------|-------------|
| `GOOGLE_CLIENT_ID` | Client ID de Google Cloud Console | Si |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google Cloud Console | Si |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Developer Token de Google Ads API | Si (para llamadas a la API) |

El usuario debera obtener estas credenciales desde:
1. [Google Cloud Console](https://console.cloud.google.com/) - Crear proyecto OAuth
2. [Google Ads API Center](https://developers.google.com/google-ads/api/docs/first-call/dev-token) - Obtener Developer Token

---

### Fase 2: Edge Function `google-oauth-exchange`

**Archivo:** `supabase/functions/google-oauth-exchange/index.ts`

Estructura basada en `meta-oauth-exchange`:

```text
Flujo de la funcion:
1. Validar JWT del usuario (Authorization header)
2. Recibir `code` y `redirect_uri` del body
3. Intercambiar code por tokens via https://oauth2.googleapis.com/token
4. Guardar access_token, refresh_token y expires_at en user_integrations
5. Retornar resultado al cliente
```

Diferencias clave con Meta:
- Google retorna `refresh_token` solo en la primera autorizacion (con `prompt=consent`)
- El `access_token` expira en ~1 hora (vs 60 dias de Meta)
- Se guarda `refresh_token` para renovar el acceso automaticamente

**Configuracion en `supabase/config.toml`:**
```toml
[functions.google-oauth-exchange]
verify_jwt = false
```

---

### Fase 3: Pagina de Callback

**Archivo:** `src/pages/GoogleCallback.tsx`

Estructura identica a `MetaCallback.tsx`:

```text
1. Extraer parametros de URL: code, state, error
2. Validar state (CSRF protection) contra sessionStorage
3. Verificar sesion del usuario con supabase.auth.getSession()
4. Llamar a google-oauth-exchange con el code
5. Mostrar estado: processing | success | error
6. Redirigir a /connections tras 2-3 segundos
```

**Actualizar `src/App.tsx`:**
- Agregar ruta `/auth/google/callback` apuntando a `GoogleCallback`

---

### Fase 4: Boton OAuth para Google Ads

**Archivo:** `src/components/GoogleOAuthButton.tsx`

Similar a `MetaOAuthButton.tsx`:

```text
URL de autorizacion:
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=[GOOGLE_CLIENT_ID]
  &redirect_uri=[origin]/auth/google/callback
  &response_type=code
  &scope=https://www.googleapis.com/auth/adwords
  &access_type=offline
  &prompt=consent
  &state=[UUID para CSRF]
```

Parametros importantes:
- `access_type=offline`: Solicita refresh_token
- `prompt=consent`: Fuerza pantalla de consentimiento (necesario para refresh_token)
- `scope=adwords`: Acceso a Google Ads API

**Nota:** El `GOOGLE_CLIENT_ID` debe estar hardcodeado en el componente (es publico, similar a `META_APP_ID`)

---

### Fase 5: Actualizar Connections.tsx

**Archivo:** `src/pages/Connections.tsx`

Cambios:
1. Importar `GoogleOAuthButton`
2. Modificar el renderizado del boton de Google Ads para usar OAuth real:

```tsx
// Antes: boton naranja generico
// Despues: 
{platform.id === 'google_ads' ? (
  <GoogleOAuthButton isConnecting={isConnecting} />
) : ...}
```

---

### Fase 6: Actualizar useIntegrations

**Archivo:** `src/hooks/useIntegrations.ts`

Agregar funcion para obtener detalles de cuentas de Google Ads:

```text
El metodo getAccountDetailsByPlatform ya soporta 'google_ads'
y retorna demo accounts si no hay conexion real.

Despues de la integracion OAuth, retornara las cuentas reales
almacenadas en account_ids.
```

No se requieren cambios significativos - la estructura existente ya soporta multiples plataformas.

---

### Diagrama de Flujo

```text
Usuario click "Conectar con Google"
        |
        v
GoogleOAuthButton genera state UUID
Guarda en sessionStorage: "google_oauth_state"
        |
        v
Redirect a Google OAuth:
accounts.google.com/o/oauth2/v2/auth
  ?client_id=...
  &scope=adwords
  &access_type=offline
  &prompt=consent
        |
        v
Usuario autoriza en Google
        |
        v
Google redirige a:
/auth/google/callback?code=XXX&state=YYY
        |
        v
GoogleCallback.tsx:
  1. Valida state vs sessionStorage
  2. Obtiene sesion de Supabase
  3. POST a google-oauth-exchange
        |
        v
Edge Function:
  POST https://oauth2.googleapis.com/token
  {
    code, client_id, client_secret,
    redirect_uri, grant_type: authorization_code
  }
        |
        v
Google retorna:
  access_token, refresh_token, expires_in
        |
        v
Edge Function guarda en user_integrations:
  platform: 'google_ads'
  access_token, refresh_token
  token_expires_at
  status: 'connected'
        |
        v
Retorna success al cliente
        |
        v
GoogleCallback muestra "Conexion exitosa"
Redirige a /connections
```

---

### Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `supabase/functions/google-oauth-exchange/index.ts` | Crear | Edge function para intercambio de tokens |
| `supabase/config.toml` | Modificar | Agregar config para nueva funcion |
| `src/pages/GoogleCallback.tsx` | Crear | Pagina de callback OAuth |
| `src/components/GoogleOAuthButton.tsx` | Crear | Boton de conexion OAuth |
| `src/pages/Connections.tsx` | Modificar | Usar GoogleOAuthButton |
| `src/App.tsx` | Modificar | Agregar ruta /auth/google/callback |

---

### Consideraciones de Seguridad

1. **CSRF Protection**: El parametro `state` con UUID validado en sessionStorage
2. **JWT Validation**: Edge function valida token de usuario antes de procesar
3. **Service Role Key**: Se usa solo en la edge function para bypass de RLS
4. **Secrets**: `GOOGLE_CLIENT_SECRET` nunca se expone al cliente

---

### Prerequisitos del Usuario

Para que la integracion funcione, el usuario debe:

1. Crear proyecto en Google Cloud Console
2. Habilitar Google Ads API
3. Configurar OAuth consent screen (puede ser "Testing" o "Published")
4. Crear credenciales OAuth 2.0 (Web application)
5. Agregar Authorized redirect URIs:
   - `https://disruptivaa.lovable.app/auth/google/callback`
   - `https://[preview-url].lovable.app/auth/google/callback`
6. Proporcionar Client ID y Client Secret para configurar como secrets en Supabase

