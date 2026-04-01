

## Plan: Generar plantillas de propuesta por servicio y guardarlas en Supabase

### Situación actual

- Existe **1 registro** en `proposal_templates` con `service_type = 'digital_30_dias'` pero con `html_content` **vacío**.
- El HTML real (1330 líneas) vive en `public/proposal-template.html` y se usa como fallback cuando el template en DB está vacío.
- El editor cae al archivo estático si no encuentra contenido en la DB.

### Servicios a crear (basados en las páginas de servicios del sitio)

| service_type | Nombre | Descripción |
|---|---|---|
| `digital_30_dias` | Ecosistema Digital 30 Días | Ya existe — hay que llenar su `html_content` |
| `crm_hubspot` | CRM & HubSpot | Implementación CRM, pipeline, automatizaciones |
| `marketing_ads` | Marketing & Pauta Digital | Meta Ads, Google Ads, estrategia de pauta |
| `websites_landings` | Websites & Landing Pages | Desarrollo web, landing pages de conversión |
| `shopify` | Shopify & E-commerce | Tienda online, pasarelas de pago |
| `mvp_aplicaciones` | MVP & Aplicaciones | Desarrollo de producto mínimo viable |

### Estrategia de generación

Cada plantilla comparte el **mismo CSS** (variables de marca, clases de layout) pero tiene **contenido diferente** en las secciones del body (hero, diagnóstico, alcance, diferenciadores). Las secciones comunes que permanecen iguales con placeholders son:

- Hero con `{{COMPANY_NAME}}` y `{{PROPOSAL_DATE}}`
- Inversión con `{{PRICE}}` y `{{PAYMENT_TYPE_LABEL}}`
- Términos con `{{TERMS_CONDITIONS}}`
- CTAs con `{{CTA_PRIMARY_URL}}` y `{{CTA_SECONDARY_URL}}`
- Footer con datos dinámicos

### Implementación (3 pasos)

**Paso 1 — Actualizar `digital_30_dias`**: Copiar el HTML actual de `public/proposal-template.html` completo al campo `html_content` del registro existente vía INSERT/UPDATE.

**Paso 2 — Crear 5 plantillas nuevas**: Para cada servicio, generar un HTML completo que:
- Reutilice el mismo bloque `<style>` (CSS idéntico)
- Adapte el contenido del hero (headline, descripción, stats)
- Tenga secciones de diagnóstico y alcance específicas al servicio
- Mantenga la sección de inversión, próximos pasos, términos y CTA con placeholders
- Inserte en `proposal_templates` vía la herramienta de datos

**Paso 3 — Verificar desde el editor**: Confirmar que el select de "Servicio (plantilla)" muestra las 6 opciones y que la vista previa carga el HTML correcto desde la DB.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Supabase data (insert tool) | UPDATE `digital_30_dias` con HTML completo; INSERT 5 registros nuevos |
| Ningún archivo de código | El editor y la vista pública ya soportan el flujo — solo faltan los datos |

### Nota sobre tamaño

Cada plantilla HTML es ~40-60KB de texto. Se insertarán vía la herramienta de datos de Supabase. El CSS compartido (~800 líneas) se repite en cada plantilla para que sean independientes (no requieren archivo externo).

