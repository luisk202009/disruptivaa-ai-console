
# Plan: Branding Dinamico (White Label) — Tarea 5, Sprint 6

## Resumen

Inyectar dinamicamente el color de branding de la empresa del usuario como variable CSS `--primary-company`, y actualizar los componentes clave para usar ese color en lugar de valores hardcodeados. Mostrar el nombre de la empresa en el sidebar.

---

## Cambios Detallados

### 1. Crear `src/hooks/useCompanyBranding.ts`

Hook dedicado que:
- Usa `useUserProfile` para obtener `company_id`
- Consulta la tabla `companies` para obtener `name` y `branding_color`
- Inyecta un tag `<style>` en el `<head>` con la variable CSS `--primary-company`
- Default: `#00A3FF` si no hay color definido
- Retorna `{ companyName, companyColor, isLoading }`

```typescript
// Inyeccion del style tag
useEffect(() => {
  const color = company?.branding_color || '#00A3FF';
  const style = document.getElementById('company-branding') || document.createElement('style');
  style.id = 'company-branding';
  style.textContent = `:root { --primary-company: ${color}; }`;
  document.head.appendChild(style);
  return () => { style.remove(); };
}, [company?.branding_color]);
```

### 2. Integrar en `src/App.tsx`

- Crear un componente wrapper `BrandingProvider` dentro de App que invoque `useCompanyBranding()` una sola vez (debe estar dentro de `AuthProvider` y `QueryClientProvider`)
- Envolver las rutas con este provider

### 3. Actualizar `src/components/ServiceCard.tsx`

- Reemplazar el color hardcodeado `accentColor` por `var(--primary-company)` via estilos inline
- Los hovers y sombras usaran el mismo color con transparencia

Cambios especificos:
```typescript
const accentColor = companyColor || "var(--primary-company, #00A3FF)";
```

### 4. Actualizar `src/components/AgentCard.tsx`

- Cambiar el icono container de `bg-muted` a usar `var(--primary-company)` con transparencia (`20`)
- Hover state con color dinamico

Cambio en linea 66:
```typescript
<div className="w-12 h-12 rounded-lg flex items-center justify-center"
  style={{ backgroundColor: `color-mix(in srgb, var(--primary-company, #00A3FF) 15%, transparent)` }}>
  <Icon className="w-6 h-6" style={{ color: 'var(--primary-company, #00A3FF)' }} />
</div>
```

### 5. Actualizar `src/components/Dashboard.tsx`

- Importar `useCompanyBranding` para pasar `companyColor` a cada `ServiceCard`
- El icono `Globe2` usara el color dinamico

Cambios:
```typescript
const { companyColor } = useCompanyBranding();

// En ServiceCard
<ServiceCard ... companyColor={companyColor} />

// En Globe2 icon
<Globe2 size={18} style={{ color: 'var(--primary-company, #00A3FF)' }} />
```

### 6. Personalizar `src/components/Sidebar.tsx`

- Importar `useCompanyBranding`
- Mostrar `companyName` encima del nombre del usuario en el footer
- Usar el color de empresa para el avatar ring

Cambio en el footer (lineas 467-481):
```typescript
const { companyName } = useCompanyBranding();

// Encima del nombre del usuario
{companyName && !collapsed && (
  <p className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">
    {companyName}
  </p>
)}
<p className="text-sm font-medium text-zinc-200 truncate tracking-wide">
  {getUserDisplayName()}
</p>
```

### 7. Traducciones (i18n)

No se necesitan nuevas claves para esta tarea (el nombre de empresa viene de la DB).

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/hooks/useCompanyBranding.ts` | **Crear** | Hook que inyecta CSS variable y retorna datos de empresa |
| `src/App.tsx` | **Modificar** | Agregar BrandingProvider wrapper |
| `src/components/ServiceCard.tsx` | **Modificar** | Usar var(--primary-company) para acentos |
| `src/components/AgentCard.tsx` | **Modificar** | Color dinamico en icono y hover |
| `src/components/Dashboard.tsx` | **Modificar** | Pasar companyColor a ServiceCards |
| `src/components/Sidebar.tsx` | **Modificar** | Mostrar nombre de empresa en footer |

## Seguridad

- La consulta a `companies` ya esta protegida por RLS (usuarios solo ven su propia empresa)
- No se requieren migraciones de base de datos
- El color se sanitiza implicitamente al usarse como valor CSS via style tag (no se ejecuta JS)

## Verificacion Post-Implementacion

- [ ] El color de branding de la empresa se aplica en ServiceCards, AgentCards y iconos
- [ ] Si no hay empresa asignada, se usa Electric Blue (#00A3FF) por defecto
- [ ] El nombre de la empresa aparece en el sidebar encima del nombre del usuario
- [ ] Los hovers y efectos visuales usan el color dinamico con transparencia
- [ ] Al cambiar de empresa (admin), el color se actualiza automaticamente
