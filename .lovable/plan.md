
# Plan: Ajustes UX del Sidebar

## Objetivo
Simplificar la navegación del Sidebar eliminando elementos redundantes y optimizando el uso del espacio vertical.

---

## Cambios a Implementar

### Archivo: `src/components/Sidebar.tsx`

#### Cambio 1: Eliminar el Botón "Nueva Conversación"
**Ubicación:** Líneas 229-251

Eliminar todo el bloque del CTA "Nuevo Chat":
```tsx
{/* New Conversation CTA - Aligned with NavItems but with subtle brand accent */}
<div className="px-4 py-3">
  <button
    onClick={handleNewConversation}
    ...
  </button>
</div>
```

#### Cambio 2: Eliminar "Conversaciones" del Menú de Navegación
**Ubicación:** Línea 183

Eliminar la entrada de Conversaciones del array `navItems`:
```tsx
// Antes (4 items):
const navItems = [
  { id: "dashboard", ... },
  { id: "panels", ... },
  { id: "agents", ... },
  { id: "conversations", ... }, // ← Eliminar esta línea
];

// Después (3 items):
const navItems = [
  { id: "dashboard", ... },
  { id: "panels", ... },
  { id: "agents", ... },
];
```

#### Cambio 3: Reducir Espaciado entre Secciones
**Ubicación:** Línea 311

Cambiar `mt-6 mb-4` a `mt-3 mb-3` en la sección de Proyectos:
```tsx
// Antes:
<div className="shrink-0 px-4 mt-6 mb-4">

// Después:
<div className="shrink-0 px-4 mt-3 mb-3">
```

---

## Estructura Final del Sidebar

```text
┌─────────────────────────────────────────┐
│ HEADER FIJO                             │
│   • Logo                                │
│   • Buscador de Chats                   │
├─────────────────────────────────────────┤
│ AREA SCROLLABLE                         │
│   • Dashboard                           │
│   • Paneles                             │
│   • Agentes AI                          │
│   • Proyectos (espacio reducido)        │
│   • Conversaciones (lista con scroll)   │
├─────────────────────────────────────────┤
│ FOOTER FIJO                             │
│   • Perfil de usuario                   │
│   • Toggle de colapso                   │
└─────────────────────────────────────────┘
```

---

## Resumen de Modificaciones

| Elemento | Acción | Impacto |
|----------|--------|---------|
| Botón "Nueva Conversación" | Eliminar | Simplifica header |
| Menú "Conversaciones" | Eliminar | Navegación más limpia |
| Espaciado de Proyectos | Reducir `mt-6` → `mt-3` | Vista más compacta |

---

## Verificación Post-Implementación

- [ ] El botón "Nueva Conversación" ya no aparece en el sidebar
- [ ] El menú solo muestra 3 opciones: Dashboard, Paneles, Agentes AI
- [ ] La sección de Proyectos está más cerca de la navegación
- [ ] Las conversaciones individuales siguen siendo clickeables para acceder al historial
