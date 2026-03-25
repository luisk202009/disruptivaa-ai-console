

# Ajustes de Navbar, Brief Selector y Ruta

## Cambios

### 1. Navbar — Mayor espaciado (`src/components/landing/Navbar.tsx`)
- Cambiar la altura del nav de `h-16` a `h-20`
- Aumentar el gap entre los links centrales de `gap-8` a `gap-10`
- Aumentar el gap entre los CTAs de la derecha de `gap-3` a `gap-4`

### 2. Brief Selector — Añadir los 2 servicios faltantes (`src/pages/Brief.tsx`)
Añadir al array `options`:
- `{ id: "website", icon: Layout, title: "Websites & Landings", subtitle: "Sitios web y landing pages de alta conversión", color: "text-blue-400", bgColor: "bg-blue-500/10" }`
- `{ id: "mvp", icon: Rocket, title: "MVP & Aplicaciones", subtitle: "Tu idea hecha producto digital en semanas", color: "text-violet-400", bgColor: "bg-violet-500/10" }`

Cambiar el grid a 3 columnas en desktop (`md:grid-cols-3`) para acomodar 6 tarjetas (2 filas x 3).

Importar `Layout` de lucide-react.

### 3. Ruta pública `/brief` (`src/App.tsx`)
- Cambiar la ruta de `/internal/brief-selector` a `/brief` para que sea accesible desde `disruptivaa.com/brief`
- Actualizar cualquier referencia interna a la ruta antigua

### 4. Actualizar CTAs que apuntan a `/internal/brief-selector`
Buscar y reemplazar referencias a `/internal/brief-selector` por `/brief` en las páginas de servicios y el Navbar.

| Archivo | Cambio |
|---|---|
| `src/components/landing/Navbar.tsx` | Espaciado mayor |
| `src/pages/Brief.tsx` | +2 opciones, grid 3 cols |
| `src/App.tsx` | Ruta `/brief` |
| `src/pages/servicios/*.tsx` | CTAs → `/brief` |

