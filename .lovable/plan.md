

## Plan: Actualizar Módulo de Propuestas con Plantilla Fija y Vista Previa

El problema es que la migración de DB y los cambios de código del plan anterior nunca se aplicaron. Los archivos siguen usando el esquema viejo (`html_content`, sin `company_name`). Hay que ejecutar todo ahora.

### 1. Migración de Base de Datos

Agregar `company_name` a la tabla `proposals` y actualizar la política RLS para incluir los nuevos estados:

```sql
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT '';
-- Actualizar RLS para nuevos estados
DROP POLICY IF EXISTS "Public can view sent proposals" ON public.proposals;
CREATE POLICY "Public can view sent proposals"
  ON public.proposals FOR SELECT TO anon, authenticated
  USING (status IN ('sent', 'viewed', 'accepted', 'rejected'));
```

Nota: se mantiene `html_content` en la DB por compatibilidad con propuestas existentes, pero el editor ya no lo usara.

### 2. `src/hooks/useProposals.ts`

- Agregar `company_name` al tipo `Proposal`
- Actualizar mutaciones create/update para incluir `company_name`
- Agregar mutacion `duplicateProposal` que copia titulo, company_name, lead_id con slug + `-copia` y status `draft`

### 3. `src/components/admin/ProposalEditor.tsx` — Rediseño completo

Reemplazar el textarea de HTML por:
- Campo **Titulo** (auto-genera slug)
- Campo **Slug** (editable)
- Campo **Nombre de la empresa** (nuevo, requerido) — este valor reemplaza `{{COMPANY_NAME}}` en la plantilla
- Selector **Lead vinculado** (opcional)
- Selector **Estado** (draft, sent, accepted, rejected)
- Boton **"Vista previa"** — abre `/p/:slug` en nueva pestana (o muestra iframe inline con la plantilla + company_name inyectado)
- Boton **"Generar propuesta"** — guarda y cierra el dialog

La vista previa inline: fetch de `/proposal-template.html`, reemplaza `{{COMPANY_NAME}}` con el valor del campo, y muestra un iframe dentro del dialog.

### 4. `src/pages/admin/AdminProposals.tsx`

- Agregar columna "Empresa" a la tabla
- Agregar boton **Duplicar** (icono Copy) en acciones
- Actualizar badges con nuevos estados: `accepted` (verde), `rejected` (rojo)
- Cambiar URLs de `/propuesta/` a `/p/`
- Agregar filtros para los nuevos estados

### 5. `src/pages/ProposalView.tsx`

- En vez de leer `html_content` de la DB, hacer fetch de `/proposal-template.html`
- Leer `company_name` de la propuesta
- Reemplazar `{{COMPANY_NAME}}` en el template con `company_name`
- Renderizar en iframe con `srcDoc`

### 6. `src/App.tsx`

- Agregar ruta `/p/:slug` apuntando a `ProposalView`
- Mantener `/propuesta/:slug` como redirect o alias

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | Agregar `company_name`, actualizar RLS |
| `src/hooks/useProposals.ts` | Tipo + duplicateProposal |
| `src/components/admin/ProposalEditor.tsx` | Reescribir: quitar textarea HTML, agregar company_name, estado, vista previa |
| `src/pages/admin/AdminProposals.tsx` | Columna empresa, duplicar, nuevos badges, URLs `/p/` |
| `src/pages/ProposalView.tsx` | Usar template + company_name en vez de html_content |
| `src/App.tsx` | Agregar ruta `/p/:slug` |

