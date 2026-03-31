

## Plan: Agregar Sección "Inversión Estratégica" a la Plantilla de Propuestas

### Resumen

Insertar una nueva sección "06 — Inversión Estratégica" en `public/proposal-template.html` justo antes de "Próximos Pasos", con dos tarjetas de precio en grid responsive. Se renumerarán las secciones posteriores.

### Cambios en `public/proposal-template.html`

**1. CSS nuevo** — Agregar estilos para el grid de pricing:
- `.pricing-grid`: `display: grid; grid-template-columns: 1fr 1fr; gap: 2px;` con media query para 1 columna en móvil
- `.pricing-card`: fondo `var(--dark3)`, padding, borde sutil dorado para la tarjeta principal
- `.pricing-amount`: tipografía Barlow Condensed grande con color dorado
- `.pricing-note`: texto secundario para la nota del plan anual

**2. HTML de la sección** — Insertar antes de "Próximos Pasos" (línea 1145):

| Elemento | Contenido |
|----------|-----------|
| Section header | `05 — Inversión Estratégica` |
| Tarjeta 1 | Tag: "Pago Único", Precio: "1,200 USD", Desc + 3 items (propiedad código, instalación servidores, documentación) |
| Tarjeta 2 | Tag: "Soporte", Precio: "99 USD / mes", Nota: "ó 1,000 USD / año", 3 items (monitoreo, seguridad, soporte prioritario) |

**3. Renumeración** — Las secciones posteriores se ajustan:
- "Próximos Pasos" pasa de `05` → `06`
- La sección CTA y footer no tienen número, no cambian

### Notas
- Se reutilizan las clases existentes: `section`, `alt`, `section-header`, `section-num`, `tag`, `deliverables`
- Los valores (1,200 USD, 99 USD/mes) quedan hardcodeados en la plantilla — si en el futuro se necesitan dinámicos, se pueden convertir a placeholders `{{...}}`
- No se requiere migración SQL ni cambios en el editor

