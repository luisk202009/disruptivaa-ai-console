

# Plan: Exportacion de Informes y Snapshot de Proyecto

## Resumen

Crear un sistema de exportacion a nivel de proyecto que genere un informe ejecutivo combinando metas, metricas reales y recomendaciones del agente IA. Incluye copia al portapapeles (Markdown), descarga como archivo, y generacion de resumen ejecutivo con IA.

---

## Analisis del Estado Actual

| Componente | Estado |
|------------|--------|
| `ExportReportDialog.tsx` (dashboards) | Existe, pero es para widgets de dashboard, no proyectos |
| `ProjectHealthCard.tsx` | Tiene datos de metas vs metricas reales |
| `useGoalMetrics.ts` | Hook que obtiene metricas reales o demo |
| `useProjectGoals.ts` | Hook con metas del proyecto |
| `disruptivaa-agent` Edge Function | Soporta multilenguaje, tiene contexto de goals |
| Traducciones ES/EN/PT | Infraestructura completa |

---

## Arquitectura de la Solucion

### Nuevo Componente: `src/components/projects/ProjectExportDialog.tsx`

Modal con las siguientes secciones seleccionables via checkboxes:

1. **Estado de Metas** - Tabla comparativa Meta vs Realidad con semaforo
2. **Metricas de Plataformas** - Resumen de datos de Meta/Google Ads
3. **Resumen Ejecutivo IA** - Parrafo generado por el agente

El modal mostrara una vista previa del informe en Markdown y permitira:
- Copiar al portapapeles (Markdown)
- Descargar como .txt
- Imprimir / Guardar como PDF (usando `window.print()` con estilos optimizados)

### Nueva Edge Function Action: `generate-executive-summary`

En lugar de crear una nueva Edge Function separada, se anadira una accion dentro de `disruptivaa-agent` que reciba los datos del proyecto y genere un parrafo ejecutivo. Esto reutiliza la autenticacion, el contexto multilingue y la conexion con la API de IA ya existentes.

Se invocara enviando un mensaje especial con un flag `action: "executive-summary"` al endpoint existente.

---

## Cambios Detallados

### 1. Crear `src/components/projects/ProjectExportDialog.tsx`

**Props:**
```typescript
interface ProjectExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  projectColor: string;
  goals: ProjectGoal[];
  metricsData: GoalMetricData[];
  isDemo: boolean;
}
```

**Funcionalidad:**
- 3 checkboxes: "Incluir Metas", "Incluir Metricas", "Incluir Resumen IA"
- Boton "Generar Resumen IA" que llama al edge function
- Estado de carga mientras se genera el resumen
- Vista previa en textarea readonly
- Botones: Copiar Markdown, Descargar .txt, Imprimir

**Generacion del informe:**
- Header con nombre del proyecto, fecha, hora (locale-aware)
- Seccion "Metas vs Realidad" con tabla Markdown y emojis semaforo
- Seccion "Metricas de Plataformas" con valores actuales
- Seccion "Resumen Ejecutivo" con el texto generado por IA
- Footer con creditos "Generado por Disruptivaa"

### 2. Modificar `supabase/functions/disruptivaa-agent/index.ts`

Anadir deteccion de `action: "executive-summary"` en el body del request.

Cuando se detecte esta accion:
- Construir un prompt especifico para resumen ejecutivo
- Incluir los datos de metas y metricas proporcionados en el body
- Generar un parrafo conciso (3-5 oraciones) en el idioma del usuario
- Retornar el resumen directamente sin persistir en `agent_messages`

**Datos esperados en el body:**
```typescript
{
  action: "executive-summary",
  projectId: string,
  goalsData: Array<{
    metric_key: string;
    target_value: number;
    current_value: number;
    is_on_track: boolean;
  }>
}
```

**Prompt del resumen:**
```
Genera un resumen ejecutivo de 3-5 oraciones sobre el desempenio
de este proyecto de marketing digital. Usa un tono profesional
y menciona las metricas clave, que metas se estan cumpliendo y
cuales necesitan atencion. No uses emojis. Se directo y accionable.
```

### 3. Modificar `src/pages/ProjectDetail.tsx`

- Importar `ProjectExportDialog`
- Anadir estado `exportOpen` para controlar el modal
- Anadir boton "Generar Informe" en el header (icono `FileText`)
- Pasar `goals`, `metricsData` y `isDemo` al dialog

Para obtener `metricsData` a nivel de ProjectDetail, se necesita elevar el uso de `useGoalMetrics` desde `ProjectHealthCard` hacia `ProjectDetail`. Actualmente `ProjectHealthCard` usa el hook internamente. El cambio:

- Llamar `useGoalMetrics(goals)` en `ProjectDetail`
- Pasar `metricsData` como prop a `ProjectHealthCard` (modificar sus props)
- Pasar los mismos datos a `ProjectExportDialog`

### 4. Modificar `src/components/projects/ProjectHealthCard.tsx`

Cambiar para recibir `metricsData` como prop en lugar de llamar `useGoalMetrics` internamente:

```typescript
interface ProjectHealthCardProps {
  projectId: string;
  projectColor: string;
  goals: ProjectGoal[];
  metricsData: GoalMetricData[];
  metricsLoading: boolean;
  refreshing: boolean;
  isDemo: boolean;
  onRefresh: () => Promise<void>;
}
```

### 5. Actualizar Traducciones

**Nuevas claves en los 3 idiomas:**

ES:
```json
{
  "projectExport": {
    "title": "Generar Informe",
    "description": "Selecciona que incluir en el informe del proyecto.",
    "includeGoals": "Estado de Metas",
    "includeMetrics": "Metricas de Plataformas",
    "includeAISummary": "Resumen Ejecutivo (IA)",
    "generateSummary": "Generar Resumen IA",
    "generatingSummary": "Generando resumen...",
    "copyMarkdown": "Copiar Markdown",
    "downloadTxt": "Descargar .txt",
    "print": "Imprimir",
    "copied": "Informe copiado al portapapeles",
    "copyError": "Error al copiar el informe",
    "downloaded": "Informe descargado",
    "summaryError": "Error al generar el resumen ejecutivo",
    "goalsSection": "Estado de Metas",
    "metricsSection": "Metricas Actuales",
    "summarySection": "Resumen Ejecutivo",
    "achieved": "Cumplido",
    "notAchieved": "No cumplido",
    "demoDisclaimer": "Datos de demostracion - conecta tus cuentas para datos reales"
  }
}
```

EN:
```json
{
  "projectExport": {
    "title": "Generate Report",
    "description": "Select what to include in the project report.",
    "includeGoals": "Goals Status",
    "includeMetrics": "Platform Metrics",
    "includeAISummary": "Executive Summary (AI)",
    "generateSummary": "Generate AI Summary",
    "generatingSummary": "Generating summary...",
    "copyMarkdown": "Copy Markdown",
    "downloadTxt": "Download .txt",
    "print": "Print",
    "copied": "Report copied to clipboard",
    "copyError": "Error copying report",
    "downloaded": "Report downloaded",
    "summaryError": "Error generating executive summary",
    "goalsSection": "Goals Status",
    "metricsSection": "Current Metrics",
    "summarySection": "Executive Summary",
    "achieved": "Achieved",
    "notAchieved": "Not achieved",
    "demoDisclaimer": "Demo data - connect your accounts for real data"
  }
}
```

PT:
```json
{
  "projectExport": {
    "title": "Gerar Relatorio",
    "description": "Selecione o que incluir no relatorio do projeto.",
    "includeGoals": "Status das Metas",
    "includeMetrics": "Metricas das Plataformas",
    "includeAISummary": "Resumo Executivo (IA)",
    "generateSummary": "Gerar Resumo IA",
    "generatingSummary": "Gerando resumo...",
    "copyMarkdown": "Copiar Markdown",
    "downloadTxt": "Baixar .txt",
    "print": "Imprimir",
    "copied": "Relatorio copiado para a area de transferencia",
    "copyError": "Erro ao copiar o relatorio",
    "downloaded": "Relatorio baixado",
    "summaryError": "Erro ao gerar o resumo executivo",
    "goalsSection": "Status das Metas",
    "metricsSection": "Metricas Atuais",
    "summarySection": "Resumo Executivo",
    "achieved": "Cumprido",
    "notAchieved": "Nao cumprido",
    "demoDisclaimer": "Dados de demonstracao - conecte suas contas para dados reais"
  }
}
```

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/projects/ProjectExportDialog.tsx` | **Crear** | Modal de exportacion de informe |
| `src/pages/ProjectDetail.tsx` | **Modificar** | Elevar useGoalMetrics, anadir boton y dialog |
| `src/components/projects/ProjectHealthCard.tsx` | **Modificar** | Recibir metricsData como prop |
| `supabase/functions/disruptivaa-agent/index.ts` | **Modificar** | Anadir accion executive-summary |
| `src/i18n/locales/es/common.json` | **Modificar** | Nuevas claves projectExport |
| `src/i18n/locales/en/common.json` | **Modificar** | Nuevas claves projectExport |
| `src/i18n/locales/pt/common.json` | **Modificar** | Nuevas claves projectExport |

---

## Flujo del Usuario

```text
1. Usuario abre ProjectDetail
2. Hace clic en "Generar Informe" (boton en header)
3. Se abre modal con checkboxes:
   [x] Estado de Metas
   [x] Metricas de Plataformas
   [ ] Resumen Ejecutivo (IA)
4. Si activa "Resumen Ejecutivo", hace clic en "Generar Resumen IA"
5. Se llama al edge function con action: "executive-summary"
6. El informe se renderiza en vista previa
7. Usuario puede: Copiar Markdown | Descargar .txt | Imprimir
```

---

## Verificacion Post-Implementacion

- [ ] El boton "Generar Informe" aparece en ProjectDetail
- [ ] El modal muestra checkboxes funcionales
- [ ] El informe incluye tabla de metas con semaforo cuando hay goals
- [ ] El resumen IA se genera en el idioma correcto del usuario
- [ ] "Copiar Markdown" funciona y el formato es legible en Slack/Notion
- [ ] "Descargar .txt" genera archivo con nombre correcto
- [ ] "Imprimir" abre dialogo del navegador
- [ ] Todo el UI esta traducido en ES, EN y PT
- [ ] Si no hay metas, se muestra mensaje informativo

