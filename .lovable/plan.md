

# Actualizar logos de clientes con animación marquee

## Cambios

### 1. Copiar nuevos logos al proyecto
Copiar las 5 imágenes subidas a `src/assets/clients/`:
- `IMG_5631.PNG` → un cliente nuevo
- `Imagotipo_2022_Negativo_12_copia.png` → otro cliente
- `Logo_Pola_Perola_Imagotipo_Negativo.png` → Pola Perola
- `Logo-SUMA_blanco.png` → SUMA
- `Logo_HypeGoods_Blanco_fondo_negro.png` → Hype Goods

### 2. Modificar `src/pages/Nosotros.tsx`
- Eliminar import de `logoClient7` (image-19.png) y su entrada en el array `clients`
- Agregar imports de los 5 logos nuevos
- Agregar las 5 entradas al array `clients`
- Reemplazar la sección "Clientes" con una animación **marquee infinita** (CSS-only):
  - Una fila horizontal con todos los logos duplicados (para loop seamless)
  - Animación CSS `@keyframes scroll` que desplaza horizontalmente de forma continua
  - `overflow: hidden` en el contenedor, logos en línea con `gap`
  - Pausa la animación al hacer hover

### 3. Agregar keyframes en `src/index.css`
```css
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

## Archivos

| Acción | Archivo |
|--------|---------|
| COPIAR | 5 logos a `src/assets/clients/` |
| MODIFICAR | `src/pages/Nosotros.tsx` |
| MODIFICAR | `src/index.css` |

