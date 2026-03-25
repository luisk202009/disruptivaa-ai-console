

# Phase 3: Expansión de Servicios (Websites & MVPs)

## Resumen
Crear 2 nuevas páginas de servicio, añadir preguntas de brief dinámicas para ambos tipos, y actualizar Navbar + BentoGrid para incluirlos.

## Archivos a crear

### 1. `src/pages/servicios/WebsitesLandings.tsx`
Página con estructura idéntica a `CrmHubspot.tsx` (PublicLayout + hero + beneficios + CTA):
- Hero: "Websites y landing pages que convierten visitantes en clientes"
- Beneficios (4 cards): Diseño a medida, Optimización para conversión, Velocidad de carga, SEO desde el inicio
- CTA → `/internal/brief-selector`
- Icono: `Layout` de lucide-react

### 2. `src/pages/servicios/MvpAplicaciones.tsx`
Misma estructura:
- Hero: "Tu idea hecha producto digital en semanas, no meses"
- Beneficios: Validación rápida, Diseño UX profesional, Integraciones listas, Escalabilidad desde el día uno
- CTA → `/internal/brief-selector`
- Icono: `Rocket` de lucide-react

## Archivos a modificar

### 3. `src/components/brief/DynamicBriefForm.tsx`
Añadir 2 entradas en `questionsByService`:

**"website":**
- `site_goal`: Objetivo del sitio (select: Venta directa, Captación de leads, Informativo, Portfolio)
- `structure`: Estructura deseada (textarea: secciones necesarias)
- `references`: Referencias visuales o competencia (textarea)
- `brand_assets`: ¿Cuenta con manual de marca y activos? (select: Sí completo, Parcial, No tengo nada)

**"mvp":**
- `problem`: Problema principal que resuelve la app (textarea)
- `user_persona`: Perfil del usuario final (textarea)
- `features`: Funcionalidades críticas (select multi-like: Login, Pagos, Dashboard, Notificaciones, Chat — implementado como textarea para flexibilidad)
- `integrations`: Integraciones requeridas (textarea: APIs, CRM, etc.)
- `design_level`: Nivel de diseño (select: Desde cero, Basado en template, Ya tengo diseño)

### 4. `src/components/landing/Navbar.tsx`
Añadir al array `serviceLinks`:
- `{ label: "Websites & Landings", href: "/servicios/websites-landings" }`
- `{ label: "MVP & Aplicaciones", href: "/servicios/mvp-aplicaciones" }`

### 5. `src/components/landing/BentoGrid.tsx`
Expandir el array `services` de 3 a 5 cards:
- Card 4: icon `Layout`, "Websites & Landing Pages", gradiente `from-blue-500/10 to-indigo-500/5`, link `/servicios/websites-landings`
- Card 5: icon `Rocket`, "MVP & Aplicaciones", badge "Valida tu idea", gradiente `from-violet-500/10 to-purple-500/5`, link `/servicios/mvp-aplicaciones`
- Cambiar grid de `md:grid-cols-3` a: primera fila 3 cols, segunda fila 2 cols centrados (usando `md:grid-cols-6` con `md:col-span-2` para las 3 primeras y `md:col-span-3` para las 2 últimas)
- Actualizar título: "Todo lo que necesitas para escalar tu negocio"

### 6. `src/App.tsx`
Añadir rutas lazy:
- `/servicios/websites-landings` → `WebsitesLandings`
- `/servicios/mvp-aplicaciones` → `MvpAplicaciones`

### 7. `src/components/landing/Footer.tsx`
Añadir los 2 nuevos servicios a la lista de links del footer.

## Sin cambios en base de datos
La tabla `brief_submissions` ya acepta cualquier `service_type` (text) y `answers` (jsonb), no requiere migración.

