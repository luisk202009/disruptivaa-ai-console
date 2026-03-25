

# Comprehensive Rebuild: Disruptivaa Official Website

## Summary
Replace all generic content with official Disruptivaa business copy. Change accent color from Electric Blue to Brand Orange (#F97316). Add new sections (Pain Points, Value Prop), replace service pillars, create `/negocio-14-dias` page with pricing, update footer with locations + WhatsApp button, and update navbar links.

## Changes

### 1. Global: Accent color swap
Replace all `hsl(213,100%,48%)` / `hsl(213,100%,42%)` / `hsl(213,100%,60%)` references with `#F97316` / `#EA580C` across:
- `Landing.tsx`, `BentoGrid.tsx`, `ContactForm.tsx`, `Navbar.tsx`, `Brief.tsx`, `SolucionesCanales.tsx`, `SolucionesAnalytics.tsx`

### 2. Landing Page (`src/pages/Landing.tsx`) -- Full rewrite
- **Hero**: New headline "Negocios que venden, operan y crecen por fin ordenados", subheadline "Integración de estrategia, tecnologia y automatizacion", CTAs: "Agendar llamada" (link to Calendly/Tally or `/brief`) + "Ver servicios" (scroll to services section)
- **New Pain Points section**: Title "Muchos negocios digitales, poco orden real" with 4 animated cards: Leads dispersos, Herramientas desconectadas, CRM sin uso, Paginas que no convierten
- **New Value Prop section**: "Construimos sistemas, no parches" with 4 pillars: Captar, Seguir, Cobrar, Escalar
- **Updated Bento Grid**: 3 new service pillars (CRM que si se usa, Negocio Digital en 14 dias, Shopify listo para vender)
- **Contact form**: Keep existing, update accent color

### 3. BentoGrid (`src/components/landing/BentoGrid.tsx`) -- Rewrite content
Replace 3 services:
1. "CRM que si se usa" -- Adopcion real y procesos comerciales. Link to `/brief`
2. "Negocio Digital en 14 dias" -- Web + CRM + Pagos + Automations. Highlight badge "Quick Time-to-market". Link to `/negocio-14-dias`
3. "Shopify listo para vender" -- E-commerce de alta conversion. Link to `/brief`

### 4. New page: `/negocio-14-dias` (`src/pages/Negocio14Dias.tsx`)
- Hero explaining the 14-day digital business system
- Two pricing cards:
  - **Starter ($1,400)**: Landing, CRM, WhatsApp
  - **Pro ($2,000)**: Complete Automation + Payments
- CTA "Agendar llamada" on each card
- Uses `PublicLayout`

### 5. Navbar (`src/components/landing/Navbar.tsx`)
- Update "Soluciones" dropdown items to match new services: "CRM", "Negocio en 14 dias" (`/negocio-14-dias`), "Shopify"
- Or simplify to link to service sections on homepage
- Change "Empezar" button text and accent to orange

### 6. Footer (`src/components/landing/Footer.tsx`)
- Add locations section: Colombia (Pereira), Espana (Foz), Portugal (Guimaraes) with map pin icons
- Update link structure to match new pages
- Keep copyright

### 7. WhatsApp Floating Button (new component: `src/components/landing/WhatsAppButton.tsx`)
- Fixed bottom-right floating button with WhatsApp icon
- Links to `https://wa.me/PHONE_NUMBER` (placeholder)
- Added to `PublicLayout.tsx`

### 8. Brief page (`src/pages/Brief.tsx`)
- Keep existing two-card selector structure
- Update accent color to orange

### 9. Solutions pages update
- `SolucionesCanales.tsx` and `SolucionesAnalytics.tsx`: Update accent colors. Content can remain as secondary detail pages, or we can repurpose them if needed.

### 10. Routing (`src/App.tsx`)
- Add route: `/negocio-14-dias` -> lazy `Negocio14Dias`
- Keep all existing routes

## Files to create
| File | Purpose |
|------|---------|
| `src/pages/Negocio14Dias.tsx` | 14-day system landing with pricing |
| `src/components/landing/WhatsAppButton.tsx` | Floating WhatsApp CTA |

## Files to modify
| File | Change |
|------|--------|
| `src/pages/Landing.tsx` | Full content rewrite + new sections |
| `src/components/landing/BentoGrid.tsx` | New 3 service pillars |
| `src/components/landing/Navbar.tsx` | Updated dropdown links + orange accent |
| `src/components/landing/Footer.tsx` | Add locations, update links |
| `src/components/landing/PublicLayout.tsx` | Add WhatsAppButton |
| `src/components/landing/ContactForm.tsx` | Orange accent |
| `src/pages/Brief.tsx` | Orange accent |
| `src/pages/SolucionesCanales.tsx` | Orange accent |
| `src/pages/SolucionesAnalytics.tsx` | Orange accent |
| `src/App.tsx` | Add `/negocio-14-dias` route |

