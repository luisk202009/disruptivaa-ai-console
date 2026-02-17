
# Reestructurar Sidebar + Modulo de Agentes con Tabs

## Resumen

Limpiar el sidebar eliminando proyectos y conversaciones recientes, dejando solo items de navegacion principal. Mover el historial de conversaciones y proyectos a la pagina de Agentes usando Tabs de Shadcn/ui.

## Cambios

### 1. Sidebar Cleanup (`src/components/Sidebar.tsx`)

- **Eliminar** toda la seccion de "Sub-items: Proyectos" (lineas 317-394): el bloque collapsible con proyectos, boton crear proyecto, y lista de carpetas.
- **Eliminar** toda la seccion de "Sub-items: Recent Conversations" (lineas 396-458): lista de conversaciones, infinite scroll, indicadores de carga.
- **Eliminar** imports y hooks que ya no se necesitan: `useConversations`, `useProjects`, `CreateProjectDialog`, `ProjectItemMenu`, `ConversationItemMenu`, `MoveConversationDialog`, estados como `projectsExpanded`, `selectedProjectId`, `searchQuery`, `scrollRef`, y funciones relacionadas (`handleLoadConversation`, `handleCreateProject`, etc.).
- **Eliminar** el buscador del header (lineas 246-273) ya que solo filtraba conversaciones/proyectos.
- **Agregar** "Conexiones" como item de navegacion principal debajo de "Ecosistema Digital", con icono `Link2`.
- **Resultado final del sidebar**:

```text
+---------------------------+
| Logo                      |
+---------------------------+
| Dashboard                 |
| Paneles                   |
+---------------------------+
| SERVICIOS DE IA           |
|   Agentes AI              |
+---------------------------+
| ECOSISTEMA DIGITAL        |
|   Websites                |
|   Conexiones              |
+---------------------------+
| [Footer: perfil + toggle] |
+---------------------------+
```

### 2. Refactor Pagina de Agentes (`src/pages/Agents.tsx`)

- Importar `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` de `@/components/ui/tabs`.
- Importar `useProjects`, `useConversations` y los componentes necesarios (`CreateProjectDialog`, `ProjectItemMenu`, `ConversationItemMenu`).
- Cuando NO hay chat activo (`!isChatActive`), envolver el contenido en un componente `Tabs` con `defaultValue="gallery"`:
  - **Tab "Galeria"**: Contiene el grid de AgentCards (botones de agentes) y la consola de comandos, tal como esta ahora.
  - **Tab "Historial"**: Contiene la lista de conversaciones recientes y proyectos (movidos desde el sidebar), con buscador integrado, agrupacion por proyecto, y carga infinita.
- Usar `max-w-6xl` (en vez de `max-w-4xl`) para aprovechar el ancho disponible.
- Estilo de las tabs: fondo transparente, tab activa con borde inferior usando `var(--primary-company)` como color dinamico.

### 3. Estilos de las Tabs

```text
TabsList: bg-transparent, border-b border-white/[0.06]
TabsTrigger activa: border-b-2 con color var(--primary-company), text-foreground
TabsTrigger inactiva: text-zinc-500, hover:text-zinc-300
```

### 4. Traducciones

Agregar claves en `es/common.json`, `en/common.json`, `pt/common.json`:
- `agents.tabGallery`: "Galeria" / "Gallery" / "Galeria"
- `agents.tabHistory`: "Historial" / "History" / "Historico"

## Archivos Afectados

| Archivo | Accion |
|---------|--------|
| `src/components/Sidebar.tsx` | Eliminar proyectos, conversaciones, buscador; agregar Conexiones |
| `src/pages/Agents.tsx` | Agregar Tabs con Galeria e Historial |
| `src/i18n/locales/es/common.json` | Nuevas claves de tabs |
| `src/i18n/locales/en/common.json` | Nuevas claves de tabs |
| `src/i18n/locales/pt/common.json` | Nuevas claves de tabs |
