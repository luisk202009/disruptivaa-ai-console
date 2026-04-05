

## Plan: Blog con WordPress vía Edge Function

### Resumen

Crear una Edge Function `get-wp-posts` que actúa como proxy al API REST de WordPress, y dos páginas frontend: `/blog` (índice con tarjetas) y `/blog/:slug` (detalle del post).

### 1. Edge Function `supabase/functions/get-wp-posts/index.ts`

- Lee `WP_URL` de `Deno.env`
- Acepta query params `slug` y `page` desde la URL
- Hace fetch a `${WP_URL}/wp-json/wp/v2/posts?_embed&per_page=12&page=${page}` (o filtra por slug)
- No requiere autenticación (es contenido público)
- CORS headers estándar del proyecto
- Retorna el JSON de WordPress directamente

### 2. Registrar en `supabase/config.toml`

Agregar `[functions.get-wp-posts]` con `verify_jwt = false` (contenido público).

### 3. Página Blog Index: `src/pages/Blog.tsx`

- Usa `PublicLayout`
- Invoca `supabase.functions.invoke('get-wp-posts')` al montar
- Muestra grid de tarjetas con: imagen destacada, título (decodificado), extracto (sin HTML), fecha formateada
- Skeleton loading con 6 tarjetas placeholder
- Paginación si hay más posts
- Estado de error con mensaje amigable

### 4. Página Blog Post: `src/pages/BlogPost.tsx`

- Ruta `/blog/:slug`
- Invoca la edge function con query param `slug`
- Renderiza `content.rendered` con prose styling (similar a `MarkdownMessage` pero para HTML con `dangerouslySetInnerHTML`)
- Imágenes responsivas via CSS
- Botón "Volver al Blog"
- Skeleton loading para el contenido
- Estado 404 si no se encuentra el post

### 5. Componentes auxiliares

- `src/components/blog/BlogCard.tsx` — tarjeta individual con imagen, título, extracto, fecha
- `src/components/blog/BlogPostContent.tsx` — renderizador del contenido HTML con prose styling

### 6. Routing y navegación

- Agregar rutas `/blog` y `/blog/:slug` en `App.tsx` (públicas, lazy-loaded)
- Agregar link "Blog" al navbar en `Navbar.tsx`

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/get-wp-posts/index.ts` | Nueva edge function |
| `supabase/config.toml` | Registrar función |
| `src/pages/Blog.tsx` | Página índice del blog |
| `src/pages/BlogPost.tsx` | Página detalle del post |
| `src/components/blog/BlogCard.tsx` | Componente tarjeta |
| `src/components/blog/BlogPostContent.tsx` | Renderizador HTML |
| `src/App.tsx` | Rutas `/blog` y `/blog/:slug` |
| `src/components/landing/Navbar.tsx` | Link "Blog" en nav |

