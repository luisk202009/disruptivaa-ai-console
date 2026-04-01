

## Plan: Sistema de Plantillas por Servicio y Campos Dinámicos en Propuestas

### Resumen

Transformar el sistema actual (1 plantilla fija) a un sistema multi-plantilla donde cada servicio tiene su propio template HTML. Al crear una propuesta, el admin selecciona el servicio y se carga la plantilla correspondiente. Se agregan campos dinámicos: fecha, precio, tipo de pago y términos y condiciones.

### Arquitectura

```text
proposal_templates (nueva tabla)
├── id, name, service_type, html_content, created_at
│
proposals (columnas nuevas)
├── service_type, price, payment_type, terms_conditions, proposal_date
```

### 1. Migración SQL — Nueva tabla + columnas

**Tabla `proposal_templates`**: almacena el HTML de cada plantilla por servicio.

| Columna | Tipo | Default |
|---------|------|---------|
| id | uuid | gen_random_uuid() |
| name | text | — |
| service_type | text (unique) | — |
| html_content | text | '' |
| created_at | timestamptz | now() |

RLS: solo admins pueden CRUD; anon/authenticated pueden SELECT (para renderizar la propuesta pública).

**Columnas nuevas en `proposals`**:

| Columna | Tipo | Default |
|---------|------|---------|
| service_type | text | '' |
| price | text | '' |
| payment_type | text | 'one_time' |
| terms_conditions | text | '' |
| proposal_date | date | CURRENT_DATE |

**Seed**: Insertar la plantilla actual (`public/proposal-template.html`) como template base con `service_type = 'digital_30_dias'`. Se pueden crear templates adicionales después desde el admin.

### 2. Plantilla HTML — Nuevos placeholders

Agregar al template HTML existente (y a futuros templates):

- `{{PROPOSAL_DATE}}` — en el date-badge del hero
- `{{PRICE}}` — en la sección de inversión
- `{{PAYMENT_TYPE_LABEL}}` — etiqueta del tipo de pago (Pago Único, Mensual, etc.)
- `{{TERMS_CONDITIONS}}` — bloque de términos al final, antes del CTA

### 3. Editor (`ProposalEditor.tsx`) — Campos nuevos

Agregar al formulario:

- **Servicio** (select): carga opciones desde `proposal_templates`. Al seleccionar, guarda `service_type`.
- **Fecha de propuesta** (input date): default hoy.
- **Precio** (input text): ej. "1,200 USD".
- **Tipo de pago** (select): Pago Único / Mensual / Anual / Acuerdo de pago.
- **Términos y condiciones** (textarea): texto libre.

La **vista previa** ahora obtiene el `html_content` de `proposal_templates` según el `service_type` seleccionado (en vez del archivo estático) e inyecta todos los placeholders.

### 4. Vista pública (`ProposalView.tsx`)

- Leer `service_type`, `price`, `payment_type`, `terms_conditions`, `proposal_date` del registro de la propuesta.
- Obtener el `html_content` desde `proposal_templates` filtrado por `service_type`.
- Inyectar todos los placeholders y renderizar.

### 5. Hook (`useProposals.ts`)

- Actualizar interface `Proposal` con los nuevos campos.
- Nuevo hook `useProposalTemplates()` para listar/CRUD templates.

### 6. Admin de Templates (futuro, opcional)

Se puede agregar una página `/admin/proposal-templates` para editar el HTML de cada plantilla directamente desde el panel. Por ahora, las plantillas se gestionan vía seed SQL o editor de Supabase.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Crear tabla `proposal_templates`, agregar columnas a `proposals`, seed del template actual |
| `public/proposal-template.html` | Agregar placeholders `{{PROPOSAL_DATE}}`, `{{PRICE}}`, `{{PAYMENT_TYPE_LABEL}}`, `{{TERMS_CONDITIONS}}` |
| `src/hooks/useProposals.ts` | Nuevos campos en interface y mutaciones |
| `src/hooks/useProposalTemplates.ts` | **Nuevo** — hook para listar templates |
| `src/components/admin/ProposalEditor.tsx` | Campos de servicio, fecha, precio, tipo de pago, términos; preview desde DB |
| `src/pages/ProposalView.tsx` | Obtener template desde DB en vez de archivo estático |
| `src/integrations/supabase/types.ts` | Se actualiza automáticamente |

