

## Plan: Sistema de Gestión de Propuestas HTML

### Resumen

Crear un módulo completo para gestionar propuestas comerciales HTML desde el panel de administración, con visualización pública mediante slug.

### 1. Migración de Base de Datos

Crear tabla `proposals`:

```sql
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  html_content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para la URL /propuesta/slug)
CREATE POLICY "Public can view sent proposals"
  ON public.proposals FOR SELECT TO anon, authenticated
  USING (status IN ('sent', 'viewed'));

-- Admin tiene acceso total
CREATE POLICY "Admins have full access to proposals"
  ON public.proposals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Nuevos Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/admin/AdminProposals.tsx` | Lista de propuestas con tabla, filtros por status, y botón "Nueva Propuesta" |
| `src/components/admin/ProposalEditor.tsx` | Diálogo/formulario con inputs para title, slug (auto-generado desde title), textarea grande con monospace para HTML, selector de lead opcional, y botón guardar |
| `src/pages/ProposalView.tsx` | Página pública `/propuesta/:slug` que renderiza el HTML con `dangerouslySetInnerHTML` dentro de un iframe sandboxed para seguridad |
| `src/hooks/useProposals.ts` | Hook con queries para CRUD de propuestas |

### 3. Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar rutas: `/admin/proposals` (protegida con AdminLayout) y `/propuesta/:slug` (pública) |
| `src/components/admin/AdminLayout.tsx` | Agregar item "Propuestas" al menú de navegación con icono `FileText` |

### 4. Detalles Técnicos

**AdminProposals.tsx**: Tabla con columnas Title, Lead, Status (badge con colores), Fecha, Acciones. Botón para abrir el editor. Al guardar, genera y muestra el enlace copiable.

**ProposalEditor.tsx**: Dialog con formulario react-hook-form + zod. El slug se auto-genera desde el título (slugify). Textarea con `font-mono` y altura amplia para pegar HTML. Selector opcional de lead vinculado. Botones: Guardar como borrador, Marcar como enviada.

**ProposalView.tsx**: Ruta pública. Fetch por slug con `.eq('slug', slug)`. Renderiza el HTML dentro de un `<iframe srcDoc={html_content} sandbox="allow-same-origin" />` para aislar estilos y scripts. Al abrir, actualiza el status a `viewed` si estaba en `sent` (via edge function o RPC para evitar necesidad de auth).

**Actualización de status a "viewed"**: Se creará una función de base de datos `mark_proposal_viewed(slug text)` con `SECURITY DEFINER` que actualice el status solo si está en `sent`, permitiendo la llamada desde el cliente anónimo via `.rpc()`.

### 5. Flujo del Usuario Admin

1. Va a Admin → Propuestas
2. Clic en "Nueva Propuesta"
3. Escribe título, se auto-genera slug
4. Opcionalmente vincula un lead
5. Pega el código HTML en el textarea
6. Guarda → se muestra el enlace público copiable
7. Cambia status a "Enviada" cuando comparte el enlace

