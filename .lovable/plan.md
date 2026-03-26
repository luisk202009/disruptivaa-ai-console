

# Corrección de CTAs y limpieza de rutas de Brief

## Diagnóstico

Tras revisar todo el código:
- **Todos los CTAs ya apuntan a `/brief`** (las 6 páginas de servicios, Navbar, Footer).
- **La ruta `/brief` existe** correctamente en `App.tsx`.
- **Brief.tsx tiene los 6 servicios** configurados.
- **No hay rutas duplicadas** ni residuos de `/internal/brief-selector` o `/soluciones/*`.

## Problema encontrado

El `PublicLayout` tiene `pt-16` (4rem) pero el Navbar mide `h-20` (5rem). Esto causa que el contenido quede parcialmente oculto detrás del Navbar, lo que puede hacer que los CTAs superiores parezcan no funcionar o no ser visibles correctamente.

## Cambios

### 1. `src/components/landing/PublicLayout.tsx`
- Cambiar `pt-16` → `pt-20` para que el contenido no quede detrás del Navbar.

### 2. Verificación completa de CTAs
Confirmar que todos los links en estas páginas apuntan a `/brief`:

| Archivo | Estado |
|---|---|
| `Negocio14Dias.tsx` | ✅ Ya apunta a `/brief` |
| `CrmHubspot.tsx` | ✅ Ya apunta a `/brief` |
| `Shopify.tsx` | ✅ Ya apunta a `/brief` |
| `MarketingAds.tsx` | ✅ Ya apunta a `/brief` |
| `WebsitesLandings.tsx` | ✅ Ya apunta a `/brief` |
| `MvpAplicaciones.tsx` | ✅ Ya apunta a `/brief` |
| `Navbar.tsx` ("Agendar llamada") | ✅ Ya apunta a `/brief` |
| `Footer.tsx` | ✅ Ya apunta a `/brief` |

**Resultado**: Solo se necesita corregir el padding del layout para que el contenido no quede oculto.

