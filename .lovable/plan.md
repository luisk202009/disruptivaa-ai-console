

# Plan: Sidebar Modular con Grupos "Servicios de IA" y "Ecosistema Digital"

## Resumen

Reestructurar el sidebar para agrupar la navegacion en secciones modulares con titulos en Fira Sans Bold, mejor espaciado, y un nuevo modulo "Ecosistema Digital". Las conversaciones recientes y proyectos se mantienen como sub-items dentro de la seccion de Agentes AI.

## Cambios Detallados

### 1. `src/components/Sidebar.tsx` - Reestructuracion del menu

**Estructura nueva del area scrollable:**

```text
+---------------------------------+
| Logo                            |
| [Buscador]                      |
+---------------------------------+
| Dashboard                       |
| Paneles                         |
+---------------------------------+
| SERVICIOS DE IA          (bold) |
|   Agentes AI                    |
|     > Proyectos (collapsible)   |
|     > Recientes (collapsible)   |
+---------------------------------+
| ECOSISTEMA DIGITAL       (bold) |
|   Websites                      |
+---------------------------------+
| [Footer: perfil + collapse]     |
+---------------------------------+
```

Cambios especificos:
- Separar "Dashboard" y "Paneles" como items sueltos en la parte superior (sin grupo)
- Crear seccion **"SERVICIOS DE IA"** con titulo en `font-['Fira_Sans'] font-bold` que contiene "Agentes AI"
- Mover Proyectos y Conversaciones Recientes como sub-secciones indentadas debajo de "Agentes AI" (con `pl-6`, `text-xs` para sub-items)
- Crear seccion **"ECOSISTEMA DIGITAL"** con icono `Globe` apuntando a una nueva ruta `/websites` (o reutilizar la seccion de websites del Dashboard)
- Aumentar `py-6` entre grupos de menu (actualmente `py-4`)
- Estado activo: mantener indicador lateral `bg-[#00A3FF]` en vez de `bg-zinc-400` para el modulo activo
- Importar `Globe` de lucide-react

### 2. `src/index.css` - Asegurar Fira Sans

Verificar que la fuente Fira Sans este cargada (ya se usa segun el branding). Agregar utilidad si es necesario:
```css
.font-fira { font-family: 'Fira Sans', sans-serif; }
```

### 3. `src/i18n/locales/es/common.json` - Nuevas claves

```json
"navigation": {
  ...
  "aiServices": "Servicios de IA",
  "digitalEcosystem": "Ecosistema Digital",
  "websites": "Websites"
}
```

### 4. `src/i18n/locales/en/common.json` y `pt/common.json` - Mismas claves traducidas

### 5. `src/App.tsx` - Ruta `/websites`

Agregar ruta para la pagina de Websites (puede ser un placeholder inicial o redirigir a una seccion existente).

## Detalles de Estilo

- Titulos de seccion: `text-[10px] font-bold font-['Fira_Sans'] uppercase tracking-[0.2em] text-zinc-500`
- Sub-items (proyectos/conversaciones): `pl-6 text-[13px]` con indentacion sutil
- Separacion entre grupos: `mt-6` en lugar de `mt-3`
- Estado activo del indicador lateral: cambiar `bg-zinc-400` a `bg-[#00A3FF]`
- Panel Admin: permanece en el dropdown del footer, sin cambios

## Archivos Afectados

| Archivo | Accion |
|---------|--------|
| `src/components/Sidebar.tsx` | Reestructurar nav en grupos modulares |
| `src/index.css` | Verificar/agregar Fira Sans |
| `src/i18n/locales/es/common.json` | Agregar claves de traduccion |
| `src/i18n/locales/en/common.json` | Agregar claves de traduccion |
| `src/i18n/locales/pt/common.json` | Agregar claves de traduccion |
| `src/App.tsx` | Agregar ruta `/websites` |

