

# Mejora del flujo Brief + Vista admin de respuestas + Conversión manual de leads

## 1. Deep-link al brief desde páginas de servicio

**Problema**: Los CTAs de cada servicio llevan a `/brief` donde el usuario debe volver a elegir el servicio.

**Solución**: Usar query params (`/brief?service=website`) y pre-seleccionar el servicio automáticamente.

### Cambios:
- **`src/pages/Brief.tsx`**: Leer `searchParams.get("service")` al montar. Si existe y es un ID válido, setear `selected` directamente (el usuario ve el formulario sin el selector).
- **6 archivos en `src/pages/servicios/`**: Cambiar los `<Link to="/brief">` por `<Link to="/brief?service=ID">` donde ID es el service_type correspondiente (`crm-hubspot`, `shopify`, `14-dias`, `marketing-ads`, `website`, `mvp`).
- **`src/pages/Negocio14Dias.tsx`**: Igual, usar `/brief?service=14-dias`.
- El botón "Volver" en el formulario sigue funcionando: lleva al selector o a la página anterior.

## 2. Vista admin de respuestas de brief

Actualmente AdminLeads muestra la tabla de leads pero no las respuestas del brief.

### Cambios:
- **`src/pages/AdminLeads.tsx`**: 
  - Hacer join con `brief_submissions` al cargar leads (o cargar briefs por separado).
  - Añadir un botón "Ver brief" en cada fila que abre un dialog/drawer con las respuestas formateadas.
  - El dialog muestra: servicio, campos del formulario (labels legibles) y las respuestas del usuario.
  - Incluir vista de referencia de los campos configurados por servicio (solo lectura, mostrando qué campos tiene cada formulario).

### Nuevo componente:
- **`src/components/admin/BriefDetailDialog.tsx`**: Dialog que recibe las respuestas JSONB y el `service_type`, mapea las keys a labels legibles usando el mismo `questionsByService` del `DynamicBriefForm`, y las muestra formateadas.

### Exportar preguntas:
- **`src/components/brief/DynamicBriefForm.tsx`**: Exportar `questionsByService` para reutilizarlo en el admin.

## 3. Conversión manual de lead a usuario

El admin puede convertir un lead en usuario enviándole una invitación por email.

### Cambios:
- **Nueva edge function `invite-lead-user/index.ts`**: 
  - Recibe `lead_id` y valida que el caller sea admin (via `has_role`).
  - Usa `supabase.auth.admin.inviteUserByEmail()` con el email del lead.
  - Actualiza el status del lead a `cliente`.
  - Retorna éxito o error.

- **`src/pages/AdminLeads.tsx`**: Añadir botón "Invitar a plataforma" en las acciones de cada lead (solo visible cuando status ≠ `cliente`). Llama a la edge function y muestra confirmación.

- **Flujo del usuario invitado**: Recibe email con link magic → acepta → se crea su cuenta → redirige al dashboard. El trigger `handle_new_user` ya crea el perfil automáticamente.

## Resumen de archivos

| Archivo | Acción |
|---|---|
| `src/pages/Brief.tsx` | Leer query param `service` y pre-seleccionar |
| `src/pages/servicios/*.tsx` (6 archivos) | CTAs → `/brief?service=ID` |
| `src/pages/Negocio14Dias.tsx` | CTA → `/brief?service=14-dias` |
| `src/components/brief/DynamicBriefForm.tsx` | Exportar `questionsByService` |
| `src/pages/AdminLeads.tsx` | Join con briefs, botón "Ver brief", botón "Invitar" |
| `src/components/admin/BriefDetailDialog.tsx` | Nuevo: dialog de detalle de brief |
| `supabase/functions/invite-lead-user/index.ts` | Nueva edge function para invitar lead como usuario |

