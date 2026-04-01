

## Plan: Página Admin para Editar Plantillas de Propuestas

### Resumen

Crear `/admin/proposal-templates` con una lista de plantillas existentes y un editor split-view (código HTML a la izquierda, vista previa en iframe a la derecha) para editar cada plantilla en tiempo real.

### Archivos a crear/modificar

**1. `src/pages/admin/AdminProposalTemplates.tsx`** — Página nueva

- Lista todas las plantillas de `proposal_templates` en tarjetas/tabla con nombre y `service_type`
- Al hacer clic en "Editar", abre un editor split-view:
  - Panel izquierdo: `<textarea>` con monospace font para editar `html_content`, más campos para `name` y `service_type`
  - Panel derecho: `<iframe srcDoc={htmlContent}>` que se actualiza en tiempo real con debounce (~500ms)
- Botón "Guardar" que hace UPDATE vía Supabase
- Botón "Volver a la lista" para salir del editor
- Usa el hook `useProposalTemplates` existente para leer, y agrega una mutación de update

**2. `src/hooks/useProposalTemplates.ts`** — Agregar mutación

- Agregar `updateTemplate` mutation que hace `supabase.from("proposal_templates").update({ name, service_type, html_content }).eq("id", id)`
- Invalidar queryKey `["proposal-templates"]` on success

**3. `src/components/admin/AdminLayout.tsx`** — Agregar nav item

- Agregar entrada `{ id: "proposal-templates", icon: <Code size={18} />, label: "Plantillas", path: "/admin/proposal-templates" }` al array `adminNavItems`

**4. `src/App.tsx`** — Agregar ruta

- Agregar ruta protegida `/admin/proposal-templates` con `AdminLayout` wrapping `AdminProposalTemplates`

### Detalles del editor

- El textarea usa `font-family: monospace`, `white-space: pre`, `tab-size: 2`
- La vista previa usa iframe con `sandbox="allow-same-origin"` y `srcDoc` que se actualiza con debounce
- Layout responsive: en desktop split 50/50 horizontal, en mobile stacked vertical
- Se inyectan placeholders de ejemplo (`{{COMPANY_NAME}}` → "Empresa Demo", etc.) en la vista previa para que se vea realista

