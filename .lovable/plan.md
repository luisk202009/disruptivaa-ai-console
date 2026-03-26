

# Corrección de Brief + CRM HubSpot + Página Nosotros

## 1. Fix: Error al enviar brief (RLS)

**Causa raíz**: Al insertar un lead, el código hace `.select("id").single()` para obtener el ID. Pero la tabla `leads` solo tiene SELECT para admins. Un usuario anónimo puede insertar pero no leer el resultado.

**Solución**: Crear una nueva migración SQL que agregue una policy de SELECT en `leads` para que el insertante pueda leer su propio registro recién creado. Alternativa más simple: quitar el `as any` de `brief_submissions` y reestructurar para que el insert de `brief_submissions` no dependa del `.select()`:

```sql
CREATE POLICY "Inserters can read their own lead"
ON public.leads FOR SELECT
TO anon, authenticated
USING (true);
```

O, más seguro, generar el UUID en el cliente y usarlo directamente sin necesitar el `.select()`.

**Enfoque elegido**: Generar `lead_id` con `crypto.randomUUID()` en el cliente, pasarlo en ambos inserts, eliminando la necesidad de `.select("id").single()`. También quitar el `as any` del insert de `brief_submissions` ya que la tabla existe en los tipos.

**Archivos**:
- `src/components/brief/DynamicBriefForm.tsx` — Generar UUID client-side, quitar `.select("id").single()`, quitar `as any`

## 2. CRM HubSpot — Resaltar consultoría + implementación + acompañamiento

Actualizar `src/pages/servicios/CrmHubspot.tsx`:
- Cambiar subtítulo del hero para enfatizar: "Consultoría, implementación y acompañamiento en HubSpot"
- Agregar sección de "Nuestro proceso" con 3 fases: Consultoría (diagnóstico), Implementación (setup + migración), Acompañamiento (capacitación + soporte)
- Actualizar el copy de beneficios para reflejar el servicio integral
- Actualizar el label en el selector de Brief y Navbar dropdown de "CRM que sí se usa" → "CRM HubSpot" o mantener pero con subtítulo de consultoría

**Archivos**:
- `src/pages/servicios/CrmHubspot.tsx`
- `src/components/landing/Navbar.tsx` — Actualizar label del dropdown si aplica

## 3. Página Nosotros

Crear una nueva página `/nosotros` con:

### Secciones
1. **Hero** — Qué es Disruptivaa, misión: ayudar a empresas a crecer con tecnología y estrategia digital
2. **Qué hacemos** — Resumen de las 6 líneas de servicio con iconos
3. **Proceso de trabajo** — Cómo trabajamos (Brief → Estrategia → Ejecución → Acompañamiento)
4. **Clientes que confían en nosotros** — Logos de los 7 clientes proporcionados en un carousel/grid con fondo oscuro
5. **CTA** — Enlace a `/brief`

### Logos de clientes
Copiar las 7 imágenes subidas a `src/assets/clients/`:
- acontapp, edudestinos, kuppel, albus, asuclean, alatra (+ uno más si hay)

**Archivos nuevos**:
- `src/pages/Nosotros.tsx`

**Archivos modificados**:
- `src/App.tsx` — Agregar ruta `/nosotros`
- `src/components/landing/Navbar.tsx` — Cambiar `href: "/#nosotros"` → `href: "/nosotros"`

## Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/components/brief/DynamicBriefForm.tsx` | Fix RLS: UUID client-side, quitar `.select()` y `as any` |
| `src/pages/servicios/CrmHubspot.tsx` | Resaltar consultoría + implementación + acompañamiento |
| `src/pages/Nosotros.tsx` | **Nuevo**: página completa con secciones + logos |
| `src/App.tsx` | Agregar ruta `/nosotros` |
| `src/components/landing/Navbar.tsx` | Link Nosotros → `/nosotros` |
| `src/assets/clients/` | 7 logos de clientes copiados |

