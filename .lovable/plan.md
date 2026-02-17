
# Sprint 7 - Tarea 6: Reportes PDF Branded

## Resumen

Transformar el componente `ExportReportDialog` para generar PDFs profesionales con branding dinamico de la empresa, capturando las graficas visibles del dashboard mediante `html2canvas` y construyendo el documento con `jspdf`.

## Cambios

### 1. Nuevas Dependencias

Instalar `jspdf` y `html2canvas` para la generacion de PDFs con capturas de graficas.

### 2. Refactor de `ExportReportDialog.tsx`

Reemplazar la logica actual de exportacion de texto plano con generacion PDF:

**Estructura del PDF**:
- **Encabezado**: Nombre de la empresa (obtenido de `useCompanyBranding`) + fecha de generacion. Linea decorativa con el `branding_color` de la empresa.
- **Seccion KPIs**: Tabla con los KPIs principales (Spend, Impressions, Clicks, CTR, Conversions) extraidos de los widgets tipo `kpi`.
- **Seccion Graficas**: Capturas de pantalla de los widgets tipo chart (`area`, `bar`, `line`, `pie`) mediante `html2canvas`, insertadas como imagenes en el PDF.
- **Pie de pagina**: "Generado por Disruptivaa AI Console - [Fecha]" en cada pagina.

**Estilos dinamicos del PDF**:
- Titulos y bordes usando el `branding_color` de la empresa (convertido de hex a RGB para jsPDF).
- Tipografia Fira Sans (se usara la fuente helvetica como fallback en jsPDF, ya que embeber fuentes custom requiere conversion base64 que seria excesivo).

**UX mejorada**:
- Boton "Descargar PDF" reemplaza el boton "Descargar .txt".
- Loading spinner mientras se genera el PDF (captura de graficas puede tomar unos segundos).
- Toast de exito al completar la descarga.
- Se mantiene la opcion de copiar el texto markdown al portapapeles.

### 3. Captura de Graficas

Para capturar las graficas del canvas:
- Seleccionar los elementos DOM de los widgets via `document.querySelectorAll` dentro del canvas del dashboard.
- Usar `html2canvas` para renderizar cada widget como imagen.
- Insertar las imagenes en el PDF con dimensiones proporcionales.

### 4. Props Actualizadas

El componente necesita recibir informacion adicional:
- Se importara `useCompanyBranding` internamente para obtener `companyName` y `companyColor`.
- No se requiere cambiar las props externas; el componente obtiene el branding via hook.

### 5. Traducciones

Agregar nuevas claves i18n:
- `exportReport.generatingPdf` - "Generando PDF..." / "Generating PDF..." / "Gerando PDF..."
- `exportReport.pdfSuccess` - "PDF descargado correctamente" / "PDF downloaded successfully" / "PDF baixado com sucesso"
- `exportReport.pdfError` - "Error al generar el PDF" / "Error generating PDF" / "Erro ao gerar o PDF"
- `exportReport.downloadPdf` - "Descargar PDF" / "Download PDF" / "Baixar PDF"

## Seccion Tecnica

### Flujo de generacion del PDF

```text
Usuario click "Descargar PDF"
  -> setState(generating: true) -> muestra spinner
  -> html2canvas captura cada widget del canvas
  -> jsPDF crea documento A4 landscape
  -> Dibuja encabezado (empresa + color + fecha)
  -> Inserta tabla KPIs
  -> Inserta imagenes de graficas (una por pagina si es necesario)
  -> Dibuja pie de pagina en cada pagina
  -> doc.save(filename)
  -> toast.success()
  -> setState(generating: false)
```

### Conversion de color hex a RGB para jsPDF

```typescript
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 163, b: 255 };
};
```

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `package.json` | Agregar `jspdf` y `html2canvas` |
| `src/components/dashboards/ExportReportDialog.tsx` | Refactorizar con generacion PDF |
| `src/i18n/locales/es/common.json` | Agregar traducciones PDF |
| `src/i18n/locales/en/common.json` | Agregar traducciones PDF |
| `src/i18n/locales/pt/common.json` | Agregar traducciones PDF |
