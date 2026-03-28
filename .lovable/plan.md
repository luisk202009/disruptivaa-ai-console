

# Refactorización del Sistema de Proyectos

## Resumen
Extraer proyectos como sección independiente con navegación propia, vista de lista tipo Claude Projects, detalle con tabs (Instrucciones + Base de Conocimiento / Conversaciones), y campos nuevos (descripción, instrucciones, archivos).

## Fase 1: Base de datos

**Migration 1** — Columnas nuevas en `projects` + tabla `project_files` + bucket storage:

```sql
-- Nuevas columnas en projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS instructions text;

-- Tabla project_files
CREATE TABLE project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- RLS: solo el dueño del proyecto puede gestionar archivos
CREATE POLICY "Users can manage their project files"
  ON project_files FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Storage RLS
CREATE POLICY "Users can upload project files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own project files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Fase 2: Sidebar

**`src/components/Sidebar.tsx`**:
- Agregar `FolderKanban` al import de lucide
- Insertar item "Proyectos" en `topNavItems` entre Dashboard y Paneles, path `/projects`
- Agregar `projects` al `getActiveItem()`

## Fase 3: Vista de lista `/projects`

**Crear `src/pages/Projects.tsx`**:
- Layout con Sidebar + main content
- Header: título "Proyectos" con `FolderKanban`, botón "+ Nuevo Proyecto"
- Grid responsive (2 cols desktop, 1 mobile) con tarjetas de proyecto
- Cada tarjeta: punto de color, nombre, descripción truncada, fecha relativa "Actualizado hace X"
- Click → `/project/:id`
- Empty state con ícono, texto y botón "Crear primer proyecto"
- Integra `CreateProjectDialog` (actualizado con campo descripción)

**`src/App.tsx`**: Agregar ruta `/projects` lazy-loaded y protegida.

## Fase 4: CreateProjectDialog

**`src/components/CreateProjectDialog.tsx`**:
- Agregar campo `Textarea` para descripción (opcional)
- Actualizar prop `onCreateProject` para recibir `(name, color, description)`

## Fase 5: Hooks

**`src/hooks/useProjects.ts`**:
- Agregar `description` e `instructions` a la interfaz `Project`
- `createProject` acepta `description` opcional
- `updateProject` acepta `description` e `instructions`

**Crear `src/hooks/useProjectInstructions.ts`**:
- `useProjectInstructions(projectId)` → `{ instructions, saveInstructions, loading }`
- Usa `supabase.from('projects').update({ instructions })` directamente

**Crear `src/hooks/useProjectFiles.ts`**:
- `uploadFile(projectId, file)` → sube a `project-files/{userId}/{projectId}/{fileName}`, inserta en `project_files`
- `deleteFile(fileId, filePath)` → elimina de storage y tabla
- `files` state con realtime subscription

## Fase 6: Refactorizar ProjectDetail

**`src/pages/ProjectDetail.tsx`** — Rediseño completo con tabs:

**Header**: punto de color + nombre (h1) + descripción muted + botones acción (Generar Informe, Actualizar Datos, Metas, + Nueva Conversación)

**Tab "Instrucciones"** (2 columnas):
- Izquierda: Textarea grande + botón "Guardar instrucciones" usando `useProjectInstructions`
- Derecha: zona drag & drop para archivos + lista de archivos subidos usando `useProjectFiles`
  - Tipos: `.pdf, .md, .txt, .xlsx, .csv, .docx`
  - Cada archivo muestra ícono, nombre, tamaño, botón eliminar

**Tab "Conversaciones"**: mantiene el grid actual de conversaciones + panel lateral con `ProjectHealthCard` y goals

## Fase 7: Limpiar Agents.tsx

**`src/pages/Agents.tsx`**:
- Eliminar todo el bloque de "Projects" del tab "Historial" (líneas 355-406)
- Eliminar imports: `Folder, FolderOpen, Plus, ChevronDown, ChevronRight`
- Eliminar state: `selectedProjectId, projectsExpanded, showCreateProject`
- Eliminar hooks: `useProjects`, `CreateProjectDialog`
- Mantener solo la lista de conversaciones recientes (sin filtro por proyecto)

## Fase 8: i18n

Agregar claves `projects.*` en `es/common.json`, `en/common.json`, `pt/common.json`.

## Fase 9: Integración con agentes

**`src/components/CommandConsole.tsx`** o donde se construya el payload al edge function:
- Cuando hay `projectId` activo, incluir en el payload:
  ```
  projectContext: { instructions, files: [nombres], goals: [...] }
  ```

## Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| MIGRATION | `description`, `instructions` cols + `project_files` table + storage bucket |
| CREAR | `src/pages/Projects.tsx` |
| CREAR | `src/hooks/useProjectFiles.ts` |
| CREAR | `src/hooks/useProjectInstructions.ts` |
| MODIFICAR | `src/components/Sidebar.tsx` |
| MODIFICAR | `src/components/CreateProjectDialog.tsx` |
| MODIFICAR | `src/hooks/useProjects.ts` |
| MODIFICAR | `src/pages/ProjectDetail.tsx` |
| MODIFICAR | `src/pages/Agents.tsx` |
| MODIFICAR | `src/App.tsx` |
| MODIFICAR | `src/i18n/locales/es/common.json` |
| MODIFICAR | `src/i18n/locales/en/common.json` |
| MODIFICAR | `src/i18n/locales/pt/common.json` |

