
# Plan: Reorganización Estructural del Sidebar (Estilo ChatGPT/Midday)

## Objetivo
Reorganizar el Sidebar para que el buscador de chats sea siempre visible y el perfil de usuario permanezca anclado en la parte inferior, siguiendo el patrón de diseño de ChatGPT.

---

## Análisis del Estado Actual

### Estructura Actual del Sidebar (Líneas 200-556)

```text
┌─────────────────────────────────────────┐
│ HEADER FIJO (shrink-0)                  │
│   • Logo                                │
│   • Buscador de Chats  ← AQUÍ           │
├─────────────────────────────────────────┤
│ AREA SCROLLABLE (flex-1)                │
│   • Navegación                          │
│   • Proyectos                           │
│   • Conversaciones                      │
├─────────────────────────────────────────┤
│ FOOTER FIJO (shrink-0)                  │
│   • Perfil de usuario                   │
│   • Toggle de colapso                   │
└─────────────────────────────────────────┘
```

### Problema Detectado
El buscador (líneas 358-386) está dentro del área scrollable, por lo que desaparece cuando el usuario hace scroll en la lista de conversaciones.

---

## Estructura Objetivo

```text
┌─────────────────────────────────────────┐
│ HEADER FIJO (shrink-0)                  │
│   • Logo                                │
│   • Nuevo Chat (CTA)                    │
│   • Buscador de Chats  ← MOVER AQUÍ    │
├─────────────────────────────────────────┤
│ AREA SCROLLABLE (flex-1)                │
│   • Navegación                          │
│   • Proyectos                           │
│   • Conversaciones (scroll infinito)    │
├─────────────────────────────────────────┤
│ FOOTER FIJO (shrink-0)                  │
│   • Perfil de usuario                   │
│   • Toggle de colapso                   │
└─────────────────────────────────────────┘
```

---

## Cambios a Implementar

### Archivo: `src/components/Sidebar.tsx`

#### Cambio 1: Mover el Buscador al Header Fijo

**Ubicación actual:** Líneas 358-386 (dentro del área scrollable)

**Nueva ubicación:** Después del CTA "Nuevo Chat" (línea 251), dentro del bloque `<div className="shrink-0">`

**Código a mover:**
```tsx
{/* Search Input - Ahora en header fijo */}
{user && !collapsed && (
  <div className="px-4 pb-3">
    <div className="relative">
      <Search 
        size={14} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" 
      />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t("sidebar.searchConversations")}
        className="w-full pl-9 pr-8 py-2 bg-white/[0.03] border border-white/[0.06] 
          rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600
          focus:outline-none focus:border-white/[0.12] focus:bg-white/[0.04]
          transition-all duration-200"
      />
      {searchQuery && (
        <button 
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  </div>
)}
```

#### Cambio 2: Eliminar el Buscador del Área Scrollable

Eliminar las líneas 358-386 de su ubicación actual dentro del área scrollable.

---

## Resumen de Modificaciones

| Sección | Acción | Líneas Afectadas |
|---------|--------|------------------|
| Header Fijo | Añadir bloque de búsqueda | Después de línea 251 |
| Área Scrollable | Eliminar bloque de búsqueda | Líneas 358-386 |

---

## Resultado Esperado

1. **Buscador siempre visible**: El input de búsqueda permanecerá fijo debajo del botón "Nuevo Chat"
2. **Scroll limpio**: Solo la navegación, proyectos y conversaciones tendrán scroll
3. **Perfil anclado**: El bloque del usuario seguirá fijo en la parte inferior (ya está implementado correctamente)
4. **Scroll minimalista**: Ya existe la clase `scrollbar-minimal` aplicada al área scrollable

---

## Verificación Post-Implementación

- [ ] El buscador es visible al hacer scroll en las conversaciones
- [ ] El scroll infinito sigue funcionando para las conversaciones
- [ ] El perfil permanece anclado en la parte inferior
- [ ] La barra de scroll es minimalista y consistente con el tema oscuro
