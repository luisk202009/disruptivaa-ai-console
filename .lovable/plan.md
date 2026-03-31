

## Plan: Eliminar logo y nombre "Disruptivaa" del nav y footer de la plantilla

### Cambios en `public/proposal-template.html`

1. **Nav (hero-nav)** — Eliminar el `<div class="logo">` con la imagen. Dejar solo el `date-badge`.

2. **Footer** — Eliminar el `<div class="logo">` con la imagen. Dejar el resto del footer intacto.

3. **Title tag** — Cambiar de `{{COMPANY_NAME}} × Disruptivaa` a solo `Propuesta Comercial — {{COMPANY_NAME}}`.

No se tocan las secciones internas (como "Por qué Disruptivaa" en sección 04) ya que son contenido del cuerpo de la propuesta, no navegación.

