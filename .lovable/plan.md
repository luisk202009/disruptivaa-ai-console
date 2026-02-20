

# Sprint 8, Tarea 1: Constructor de Landings IA (Vibe Builder)

## Resumen

Crear un constructor de landing pages impulsado por IA que genere estructuras de venta (Hero, Beneficios, Prueba Social, FAQ, CTA) basadas en el contexto de la empresa y los mejores anuncios del usuario. La interfaz sera una herramienta de diseno profesional con estetica dark.

## Arquitectura

```text
LandingBuilder (pagina /landing-builder)
  ├── Panel Izquierdo: Configuracion
  │     ├── Objetivo de la landing (selector)
  │     ├── Tono de voz (selector)
  │     └── Contexto empresa (auto: nombre, color, descripcion)
  │
  ├── Boton "Generar con IA"
  │     └── Edge Function: generate-landing
  │           └── Lovable AI Gateway (gemini-3-flash-preview)
  │                 └── Retorna JSON estructurado con secciones
  │
  └── Panel Central: Previsualizacion
        ├── Hero (titulo, subtitulo, CTA)
        ├── Beneficios (3-4 items)
        ├── Prueba Social (testimonios)
        ├── FAQ (preguntas frecuentes)
        ├── CTA final
        └── Boton "Copiar Estructura" (Markdown al clipboard)
```

## Archivos Nuevos

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/LandingBuilder.tsx` | Pagina principal con layout de 2 paneles |
| `src/components/landing-builder/LandingConfig.tsx` | Panel izquierdo de configuracion |
| `src/components/landing-builder/LandingPreview.tsx` | Panel central de previsualizacion |
| `supabase/functions/generate-landing/index.ts` | Edge function que llama a Lovable AI Gateway |

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar ruta `/landing-builder` |
| `src/components/Sidebar.tsx` | Agregar item de navegacion "Vibe Builder" bajo "Servicios de IA" |
| `supabase/config.toml` | Registrar `generate-landing` |
| `src/i18n/locales/es/common.json` | Agregar claves `landingBuilder.*` |
| `src/i18n/locales/en/common.json` | Agregar claves `landingBuilder.*` |
| `src/i18n/locales/pt/common.json` | Agregar claves `landingBuilder.*` |

## Detalles Tecnicos

### 1. Edge Function `generate-landing`

Recibe el contexto de la empresa y devuelve un JSON estructurado con las secciones de la landing.

**Payload de entrada:**
```json
{
  "companyName": "Mi Agencia",
  "brandColor": "#FF7900",
  "objective": "lead_generation",
  "tone": "professional",
  "language": "es",
  "adContext": "Mejores anuncios: CTR 3.5%, CPC $0.45..."
}
```

**Respuesta esperada (via tool calling para JSON estructurado):**
```json
{
  "sections": {
    "hero": {
      "headline": "Titulo principal",
      "subheadline": "Subtitulo persuasivo",
      "cta_text": "Empezar ahora"
    },
    "benefits": [
      { "icon": "zap", "title": "Rapido", "description": "..." },
      { "icon": "shield", "title": "Seguro", "description": "..." },
      { "icon": "trending-up", "title": "Resultados", "description": "..." }
    ],
    "social_proof": [
      { "quote": "...", "author": "...", "role": "..." }
    ],
    "faq": [
      { "question": "...", "answer": "..." }
    ],
    "final_cta": {
      "headline": "...",
      "cta_text": "..."
    }
  }
}
```

Se usara **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) con el modelo `google/gemini-3-flash-preview` y **tool calling** para obtener JSON estructurado de forma confiable. La API key `LOVABLE_API_KEY` ya esta configurada.

### 2. Pagina `LandingBuilder.tsx`

Layout de dos paneles con `ResizablePanelGroup` (ya instalado como `react-resizable-panels`):

- **Panel izquierdo (30%)**: Formulario de configuracion con selectores de objetivo, tono, y boton "Generar con IA"
- **Panel derecho (70%)**: Previsualizacion en vivo de la landing generada con scroll vertical

Estado gestionado con `useState`:
- `landingData`: El JSON de secciones generado por la IA (null inicialmente)
- `isGenerating`: Boolean para estado de carga
- `config`: Objetivo, tono, contexto adicional

### 3. Panel de Configuracion (`LandingConfig.tsx`)

Campos:
- **Objetivo**: Select con opciones (generacion de leads, ventas, branding, evento)
- **Tono de voz**: Select (profesional, casual, urgente, inspiracional)
- **Contexto adicional**: Textarea para informacion extra del usuario
- **Boton "Generar con IA"**: Llama a la edge function

El nombre de empresa y color de marca se obtienen automaticamente via `useCompanyBranding()`.

### 4. Previsualizacion (`LandingPreview.tsx`)

Renderiza las secciones del JSON en componentes visuales:
- **Hero**: Fondo con gradiente usando `--primary-company`, titulo grande, subtitulo, boton CTA
- **Beneficios**: Grid de 3 columnas con iconos de Lucide
- **Prueba Social**: Cards con comillas y atribucion
- **FAQ**: Acordeon con Radix (ya instalado)
- **CTA Final**: Seccion de cierre con boton prominente

Incluye boton flotante **"Copiar Estructura"** que convierte el JSON a Markdown y lo copia al clipboard con `navigator.clipboard.writeText()`.

### 5. Navegacion

Agregar "Vibe Builder" en el sidebar bajo la seccion "Servicios de IA", junto a "Agentes AI". Icono: `Wand2` de Lucide.

Ruta: `/landing-builder` protegida con `ProtectedRoute`.

### 6. i18n

Nuevas claves bajo `landingBuilder`:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `title` | Constructor de Landings | Landing Builder | Construtor de Landings |
| `generateWithAI` | Generar con IA | Generate with AI | Gerar com IA |
| `generating` | Generando... | Generating... | Gerando... |
| `salesStructure` | Estructura de Ventas | Sales Structure | Estrutura de Vendas |
| `copyCopy` | Copiar Copy | Copy Content | Copiar Conteudo |
| `copied` | Copiado al portapapeles | Copied to clipboard | Copiado para a area de transferencia |
| `objective` | Objetivo de la landing | Landing objective | Objetivo da landing |
| `tone` | Tono de voz | Tone of voice | Tom de voz |
| `additionalContext` | Contexto adicional | Additional context | Contexto adicional |
| `leadGeneration` | Generacion de leads | Lead generation | Geracao de leads |
| `sales` | Ventas directas | Direct sales | Vendas diretas |
| `branding` | Branding / Awareness | Branding / Awareness | Branding / Awareness |
| `event` | Evento o lanzamiento | Event or launch | Evento ou lancamento |
| `professional` | Profesional | Professional | Profissional |
| `casual` | Casual y cercano | Casual and friendly | Casual e amigavel |
| `urgent` | Urgente / Escasez | Urgent / Scarcity | Urgente / Escassez |
| `inspirational` | Inspiracional | Inspirational | Inspiracional |
| `hero` | Hero | Hero | Hero |
| `benefits` | Beneficios | Benefits | Beneficios |
| `socialProof` | Prueba Social | Social Proof | Prova Social |
| `faq` | Preguntas Frecuentes | FAQ | Perguntas Frequentes |
| `finalCta` | CTA Final | Final CTA | CTA Final |
| `emptyState` | Configura los parametros y genera tu landing con IA | Set the parameters and generate your landing with AI | Configure os parametros e gere sua landing com IA |
| `vibeBuilder` | Vibe Builder | Vibe Builder | Vibe Builder |

## Estetica

- Fondo: `#000000` (consistente con toda la app)
- Tipografia: Fira Sans (heredada del sistema)
- Panel de config: Fondo `zinc-900/50`, bordes `white/[0.06]`
- Previsualizacion: Cards con bordes `white/[0.08]`, gradientes sutiles con `--primary-company`
- Boton principal "Generar": Usa `--primary-company` como background
- Estado vacio: Icono grande + texto orientativo centrado
- Animaciones de entrada con Framer Motion (fade + slide)

