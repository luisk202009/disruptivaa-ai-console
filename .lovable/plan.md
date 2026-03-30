

## Plan: Refactorización del Módulo de Propuestas con Plantilla Fija

### Resumen
Transformar el módulo de propuestas de "pegar HTML libre" a un sistema basado en una plantilla HTML fija donde solo cambia el nombre de la empresa destinataria. Incluye nuevos estados, ruta pública corta `/p/:slug`, y acción de duplicar.

### 1. Migración de Base de Datos

Modificar la tabla `proposals` existente:
- **Agregar** columna `company_name` (text, NOT NULL, default '')
- **Eliminar** columna `html_content` (ya no se necesita, el HTML es fijo)
- No se necesita cambio de tipo para `status` (ya es text libre, soporta 'accepted'/'rejected')

```sql
ALTER TABLE proposals ADD COLUMN company_name text NOT NULL DEFAULT '';
ALTER TABLE proposals DROP COLUMN html_content;
```

### 2. Plantilla HTML como Archivo Estático

- Copiar `propuesta-template.html` a `public/proposal-template.html`
- En el template, reemplazar todas las ocurrencias de "Deco Struktura" por el placeholder literal `{{COMPANY_NAME}}`
- Hay 6 ocurrencias marcadas con `<!-- {{company_name}} -->` en las líneas 787, 830, 870, 918, 960, 1139, 1162, 1217

### 3. Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useProposals.ts` | Actualizar tipo `Proposal` (quitar `html_content`, agregar `company_name`). Agregar mutación `duplicateProposal`. |
| `src/components/admin/ProposalEditor.tsx` | Reemplazar textarea HTML por campo `company_name`. Simplificar formulario. |
| `src/pages/admin/AdminProposals.tsx` | Agregar columna "Empresa", botón duplicar, nuevos badges (accepted=verde, rejected=rojo). |
| `src/pages/ProposalView.tsx` | Fetch template de `/proposal-template.html`, reemplazar `{{COMPANY_NAME}}` con `company_name` de la DB, renderizar en iframe. |
| `src/App.tsx` | Cambiar ruta de `/propuesta/:slug` a `/p/:slug`. |

### 4. Detalle del Flujo

**Crear propuesta**: Admin llena título → se auto-genera slug → escribe nombre de empresa → opcionalmente vincula lead → guarda. No hay textarea de HTML.

**Vista pública** (`/p/:slug`):
1. Fetch proposal por slug desde Supabase (obtiene `company_name`)
2. Fetch `/proposal-template.html` via `fetch()`
3. `html.replaceAll('{{COMPANY_NAME}}', proposal.company_name)`
4. Renderizar en iframe con `srcDoc`
5. Llamar RPC `mark_proposal_viewed` si status es `sent`

**Duplicar**: Copia título, company_name y lead_id. Genera nuevo slug con sufijo `-copia`. Status siempre `draft`.

### 5. Badges de Estado

| Estado | Color | Label |
|--------|-------|-------|
| draft | gris | Borrador |
| sent | azul | Enviada |
| viewed | amarillo | Vista |
| accepted | verde | Aceptada |
| rejected | rojo | Rechazada |

