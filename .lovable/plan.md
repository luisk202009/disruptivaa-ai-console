

# Nav Optimization Plan

## Changes to `src/components/landing/Navbar.tsx`

### 1. Add "Nosotros" nav link
Add a third nav item after "Brief" pointing to a section or placeholder route.

### 2. Center the menu, right-align CTAs
Restructure the desktop layout to: **Logo (left)** | **Nav links (center)** | **Log In + Agendar llamada (right)**. Use `flex justify-between` with three groups.

### 3. Active state with orange underline
Use `useLocation()` (already available) to compare `location.pathname` against each link's `href`. Apply a `border-b-2 border-[#F97316] text-foreground` style when active. For the "Servicios" dropdown, highlight when pathname matches any child route.

### 4. Close dropdown on outside click
Add a `useRef` + click-outside listener so the Servicios dropdown dismisses when clicking elsewhere (currently only toggles on button click).

### 5. CTA sync
Change "Agendar llamada" from `Link to="/brief"` to a scroll-to-contact function on the homepage (`document.getElementById('contacto')?.scrollIntoView()`), and navigate to `/brief` if not on homepage. Same logic for both desktop and mobile CTAs.

### 6. Mobile menu polish
- Add active orange underline styling to mobile links too
- Smooth slide-down animation using `framer-motion` `AnimatePresence`

## File modified
| File | Change |
|------|--------|
| `src/components/landing/Navbar.tsx` | All changes above |

