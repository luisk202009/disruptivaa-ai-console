

## Plan: Corregir Logo, Espacio Negro y CTAs Dinámicos en Propuestas

### Problemas identificados

1. **Logo roto**: La plantilla referencia `/Logo_Blanco_Completo.png` pero ese archivo no existe en `public/`. Dentro del iframe (srcDoc), las rutas relativas no funcionan. Se muestra el fallback texto "disruptivaa". Solución: usar URL absoluta `https://www.disruptivaa.com/Logo_Blanco_Completo.png`.

2. **Espacio negro enorme**: El hero tiene `min-height: 100vh` que dentro de un iframe crea un bloque negro gigante antes de la sección 2. Solución: cambiar a `min-height: auto` con padding suficiente.

3. **CTAs hardcodeados**: Los dos botones al final ("Agendar reunión" y "Ver nuestro trabajo") tienen URLs fijas. Solución: agregar placeholders `{{CTA_PRIMARY_URL}}` y `{{CTA_SECONDARY_URL}}` en la plantilla, y campos en el editor para configurarlos por propuesta.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `public/proposal-template.html` | (1) Logo → URL absoluta en header y footer. (2) Hero `.hero` → quitar `min-height: 100vh`, usar `padding: 80px 64px 48px`. (3) CTAs → usar `{{CTA_PRIMARY_URL}}` y `{{CTA_SECONDARY_URL}}` como href |
| `src/components/admin/ProposalEditor.tsx` | Agregar 2 campos: "URL Agendar reunión" y "URL Ver trabajo". Inyectar ambos placeholders junto con `{{COMPANY_NAME}}` en la vista previa |
| `src/pages/ProposalView.tsx` | Inyectar `{{CTA_PRIMARY_URL}}` y `{{CTA_SECONDARY_URL}}` desde los datos de la propuesta |
| `src/hooks/useProposals.ts` | Agregar `cta_primary_url` y `cta_secondary_url` al tipo y mutaciones |
| Migración SQL | Agregar columnas `cta_primary_url text default ''` y `cta_secondary_url text default ''` a `proposals` |

### Detalle de la inyección

En el editor y en ProposalView, después del replace de `{{COMPANY_NAME}}`:
```ts
html = html.split("{{CTA_PRIMARY_URL}}").join(ctaPrimaryUrl || "#");
html = html.split("{{CTA_SECONDARY_URL}}").join(ctaSecondaryUrl || "https://www.disruptivaa.com");
```

