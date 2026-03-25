

# Disruptivaa Ecosystem: Landing Page + Solutions + Brief

## Current State
The app currently has `/` as the authenticated dashboard (Index.tsx renders Sidebar + Dashboard). There is no public-facing landing page, solutions pages, or brief selector. The `/auth` page exists for login/register.

## Architecture Decision
Restructure routing so:
- `/` becomes the public Landing Page (visible to everyone)
- `/dashboard` becomes the authenticated app (current Index.tsx logic)
- `/soluciones/gestion-canales` and `/soluciones/data-analytics` are new public pages
- `/brief` is the interactive project selector with Tally.so iframes
- All existing protected routes remain unchanged

## Plan

### 1. Create Landing Page component (`src/pages/Landing.tsx`)
- **Hero Section**: Dark (Slate-950) with headline "El crecimiento digital no es suerte, es ingeniería", subtext, and two CTAs ("Empezar Diagnóstico" -> /brief, "Ir a la App" -> /dashboard)
- **Sticky Navbar**: Glass effect with logo, nav links (Soluciones dropdown, Brief, Login), scroll-aware background
- **Services Bento Grid**: 3-column grid with glassmorphic cards for Strategic Consulting, Channel Management, Data Analytics
- **Scroll animations** via Framer Motion (fade-in-up on intersection)
- **Footer**: Minimal with links and copyright
- Accent color: Electric Blue (#0070f3) for the public site (distinct from app's orange)

### 2. Create Solutions pages
- **`src/pages/SolucionesCanales.tsx`**: Detail page for Mercado Libre & WhatsApp channel management. Hero + feature grid + CTA
- **`src/pages/SolucionesAnalytics.tsx`**: Detail page for Data Analytics & BI. Hero + metrics visualization mockup + CTA

### 3. Create Brief Selector (`src/pages/Brief.tsx`)
- Two large hover-animated cards: "Ecosistema Digital" and "Estrategia de Crecimiento"
- React state toggles between two Tally.so iframes (placeholder IDs: `ID_TALLY_WEB`, `ID_TALLY_MKT`)
- Same dark theme and glass styling

### 4. Create shared layout components
- **`src/components/landing/Navbar.tsx`**: Sticky glass navbar with logo, links, "Log In" button. Used on all public pages
- **`src/components/landing/Footer.tsx`**: Shared footer
- **`src/components/landing/PublicLayout.tsx`**: Wraps Navbar + children + Footer

### 5. Create `leads` table in Supabase
- SQL migration to create `leads` table with columns: `id`, `name`, `email`, `company`, `service_type`, `status`, `created_at`
- RLS: allow anonymous inserts (public lead capture), authenticated select for admins
- Contact form component on landing page that inserts into this table

### 6. Update routing (`src/App.tsx`)
- `/` -> Landing (public)
- `/dashboard` -> current Index.tsx logic (protected, with Sidebar + Dashboard)
- `/soluciones/gestion-canales` -> SolucionesCanales (public)
- `/soluciones/data-analytics` -> SolucionesAnalytics (public)
- `/brief` -> Brief (public)
- Update all existing internal links that reference `/` to point to `/dashboard`
- Update ProtectedRoute redirect from `/` to `/dashboard`

### 7. Update Sidebar and internal navigation
- Sidebar logo click and "Dashboard" nav item -> `/dashboard`
- Auth redirect after login -> `/dashboard`

## Files to create
| File | Purpose |
|------|---------|
| `src/pages/Landing.tsx` | Public landing page |
| `src/pages/SolucionesCanales.tsx` | Channel management detail |
| `src/pages/SolucionesAnalytics.tsx` | Data analytics detail |
| `src/pages/Brief.tsx` | Tally.so brief selector |
| `src/components/landing/Navbar.tsx` | Sticky glass navbar |
| `src/components/landing/Footer.tsx` | Shared footer |
| `src/components/landing/PublicLayout.tsx` | Layout wrapper |
| `src/components/landing/BentoGrid.tsx` | Services grid component |
| `src/components/landing/ContactForm.tsx` | Lead capture form |
| Migration SQL | `leads` table |

## Files to modify
| File | Change |
|------|--------|
| `src/App.tsx` | New routes, move dashboard to `/dashboard` |
| `src/components/ProtectedRoute.tsx` | Redirect to `/dashboard` instead of `/` |
| `src/components/Sidebar.tsx` | Update logo click to `/dashboard` |
| `src/pages/Auth.tsx` | Redirect to `/dashboard` on success |
| `src/components/AuthModal.tsx` | Redirect to `/dashboard` |

## Performance considerations
- Landing page uses no heavy dependencies (no TanStack Query, no Supabase client)
- Lazy-load solutions and brief pages
- Optimize hero image/SVG for LCP < 1.2s
- Mobile-first responsive design throughout

