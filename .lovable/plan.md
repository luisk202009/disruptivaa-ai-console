

# Master Prompt: Disruptivaa Business OS & Website

## Resumen
Reestructurar rutas de servicios bajo `/servicios/*`, crear 3 nuevas páginas de servicio, eliminar "Brief" del nav público (moverlo a `/internal/brief-selector`), reemplazar Tally por un formulario nativo `DynamicBriefForm`, crear tabla `brief_submissions` en Supabase, actualizar el enum de status en `leads`, y crear la vista admin `/admin/leads`.

## Cambios en Base de Datos (Migraciones)

### 1. Actualizar tabla `leads`
- Cambiar columna `status` de text a un enum con valores: `oportunidad`, `cliente`, `finalizado` (o mantener text con check constraint). Default: `oportunidad`.

### 2. Crear tabla `brief_submissions`
```sql
CREATE TABLE public.brief_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  service_type text NOT NULL, -- 'crm-hubspot', 'shopify', '14-dias', 'marketing-ads'
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
-- RLS: anon/authenticated can INSERT, admins can SELECT/ALL
```

## Cambios en Rutas (`src/App.tsx`)

| Ruta actual | Nueva ruta | Acción |
|---|---|---|
| `/negocio-14-dias` | `/servicios/negocio-14-dias` | Mover |
| `/soluciones/gestion-canales` | Eliminar | Reemplazada |
| `/soluciones/data-analytics` | Eliminar | Reemplazada |
| `/brief` | `/internal/brief-selector` | Mover, ocultar del nav |
| — | `/servicios/crm-hubspot` | Nuevo |
| — | `/servicios/shopify` | Nuevo |
| — | `/servicios/marketing-ads` | Nuevo |
| — | `/admin/leads` | Nuevo (protegido) |

## Archivos a Crear

| Archivo | Descripción |
|---|---|
| `src/pages/servicios/CrmHubspot.tsx` | Página de servicio CRM con secciones: hero, beneficios, CTA |
| `src/pages/servicios/Shopify.tsx` | Página de servicio Shopify e-commerce |
| `src/pages/servicios/MarketingAds.tsx` | Página de servicio Marketing y Ads |
| `src/components/brief/DynamicBriefForm.tsx` | Formulario nativo que muestra preguntas dinámicas según `service_type`, guarda en `brief_submissions` y crea/actualiza lead |
| `src/pages/AdminLeads.tsx` | Panel CRM interno: lista leads con filtros por status, tabla con acciones de cambio de estado |

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Nuevas rutas bajo `/servicios/*`, mover `/brief` a `/internal/brief-selector`, añadir `/admin/leads` protegido |
| `src/pages/Negocio14Dias.tsx` | Sin cambios de contenido, solo se mueve la ruta |
| `src/pages/Brief.tsx` | Reemplazar placeholders de Tally por `DynamicBriefForm` |
| `src/components/landing/Navbar.tsx` | Eliminar "Brief" del menú. Actualizar dropdown Servicios con links a `/servicios/crm-hubspot`, `/servicios/negocio-14-dias`, `/servicios/shopify` |
| `src/components/landing/BentoGrid.tsx` | Actualizar links: CRM → `/servicios/crm-hubspot`, Negocio 14 días → `/servicios/negocio-14-dias`, Shopify → `/servicios/shopify` |
| `src/components/landing/Footer.tsx` | Actualizar links de servicios a nuevas rutas `/servicios/*` |
| `src/pages/Landing.tsx` | Mantener contenido actual, sin cambios |

## Detalle del DynamicBriefForm

Componente que recibe `serviceType` como prop y renderiza preguntas específicas:
- **CRM HubSpot**: ¿Cuántos vendedores?, ¿Usas CRM actualmente?, ¿Qué procesos quieres automatizar?
- **Shopify**: ¿Cuántos productos?, ¿Vendes actualmente online?, ¿Necesitas pasarela de pagos?
- **14 días**: ¿Tienes dominio?, ¿Qué vendes?, ¿Presupuesto?
- **Marketing/Ads**: ¿Plataformas actuales?, ¿Presupuesto mensual de ads?, ¿Objetivo principal?

Al enviar: inserta en `leads` (si no existe) y en `brief_submissions` con las respuestas en JSONB.

## Detalle del AdminLeads

- Tabla con columnas: Nombre, Email, Empresa, Servicio, Estado, Fecha
- Filtros por estado (oportunidad/cliente/finalizado)
- Botones para cambiar estado de cada lead
- Protegido con `ProtectedRoute` + verificación de rol admin

## Orden de Implementación
1. Migración de base de datos (leads status + brief_submissions)
2. Crear las 3 páginas de servicio con contenido placeholder profesional
3. Crear DynamicBriefForm y actualizar Brief.tsx
4. Actualizar rutas en App.tsx
5. Actualizar Navbar, BentoGrid, Footer con nuevos links
6. Crear AdminLeads

