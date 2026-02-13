
# Plan: Pulido de Produccion y Verificacion de Consistencia UI/UX - V1.0

## Resumen

Auditoria integral para eliminar textos hardcoded en espanol, mejorar empty states, garantizar responsividad y consistencia de navegacion.

---

## 1. Internacionalizacion: Textos Hardcoded a Eliminar

Se encontraron **~40+ textos en espanol** fijos en el codigo. Se moveran a los archivos de traduccion (`es.json`, `en.json`, `pt.json`).

### Archivos afectados y textos a mover:

**`src/pages/Agents.tsx` (linea 206)**
- `"¿Que quieres hacer hoy?"` -> nueva clave `agents.welcomePrompt`

**`src/components/CommandConsole.tsx` (lineas 287-311, 485-492)**
- `"Hubo un error al procesar tu solicitud..."` -> `common.requestError`
- `"Optimizar campana Meta"`, `"Analizar rendimiento Ads"`, `"Sugerir presupuesto"` -> `agents.suggestions.adsOptimizer` (array)
- `"Calificar nuevos leads"`, `"Crear secuencia de emails"`, `"Analizar pipeline"` -> `agents.suggestions.aiCrmSales` (array)
- `"¿Como puedes ayudarme?"` -> `agents.suggestions.default`
- `"Inicia sesion para chatear"` -> `agents.loginToChat`
- `"Analizando..."` -> `agents.analyzing`
- `"Escribe o adjunta archivos para analisis..."` -> `agents.writeOrAttach`
- `"Selecciona un agente para comenzar..."` -> `agents.selectToStart`

**`src/components/dashboards/DashboardWidget.tsx` (lineas 94-101, 115-118, 136, 139, 149-151, 180-182, 200, 234, 238, 241)**
- `"Configuracion requerida"` -> `widget.configRequired`
- `"Selecciona una cuenta de anuncios..."` -> `widget.selectAccount`
- `"Configurar"` -> `common.configure`
- `"Conexion requerida"` -> `widget.connectionRequired`
- `"Conecta tu cuenta de Meta Ads..."` -> `widget.connectMeta`
- `"Error al cargar datos"` -> `widget.loadError`
- `"Reintentar"` -> `common.retry`
- `"Sin datos disponibles"` -> `widget.noData`
- `"No hay datos de metricas..."` -> `widget.noMetricsData`
- `"Meta no configurada"` -> `widget.goalNotConfigured`
- `"Selecciona una meta del proyecto..."` -> `widget.selectGoal`
- `"Cuenta X"` -> `widget.accountLabel`
- `"Actualizar"` -> `common.refresh`
- `"Editar"` -> `common.edit`
- `"Eliminar"` -> `common.delete`

**`src/components/dashboards/WidgetSelector.tsx` (lineas 251-256, 440)**
- `"Anadir Widget"` -> `widget.addWidget`
- `"Selecciona una metrica o tipo de grafico."` -> `widget.selectMetric`
- `"Selecciona como visualizar la metrica."` -> `widget.selectType`
- `"Selecciona la cuenta de anuncios (opcional)."` -> `widget.selectAccountOptional`
- `"Siguiente"` -> `common.next`

**`src/components/dashboards/WidgetSettings.tsx` (lineas 140, 171, 204, 221, 238, 286)**
- Placeholders de selects: `"Seleccionar plataforma"`, `"Seleccionar cuenta"`, `"Seleccionar tipo"`, `"Seleccionar metrica"`, `"Seleccionar periodo"` -> claves bajo `widget.select.*`
- `"Cargando cuentas..."` -> `widget.loadingAccounts`
- `"Guardando..."` / `"Guardar cambios"` -> `common.saving` / `common.saveChanges`

**`src/components/dashboards/RenameDashboardDialog.tsx` (linea 96)**
- `"Guardando..."` / `"Guardar cambios"` -> reutilizar `common.saving` / `common.saveChanges`

**`src/components/dashboards/DashboardCanvas.tsx` (linea 86)**
- `"Anade widgets para comenzar..."` -> `widget.emptyCanvas`

**`src/components/projects/ProjectGoalsEditor.tsx` (linea 222, 303)**
- `"Selecciona una metrica"` -> `projectGoals.selectMetric`
- `"Guardar"` -> `common.save`

**`src/components/DeleteProjectDialog.tsx` (lineas 68, 96)**
- `"Mover a General"` -> `projects.moveToGeneral`
- `"Las conversaciones se mantendran..."` -> `projects.moveDescription`
- `"Eliminando..."` / `"Eliminar Proyecto"` -> `common.deleting` / `projects.deleteProject`

**`src/components/ConversationItemMenu.tsx` (linea 115)**
- `"Eliminando..."` / `"Eliminar"` -> `common.deleting` / `common.delete`

**`src/components/RenameProjectDialog.tsx` (linea 98)**
- `"Guardando..."` / `"Guardar"` -> `common.saving` / `common.save`

**`src/components/dashboard/GoalsSummaryWidget.tsx` (linea 68)**
- `"+X mas"` -> `common.andMore`

**`src/components/OmnichannelPerformance.tsx` (linea 213)**
- Tooltip `"Spend"` label -> `omnichannel.totalSpend`

---

## 2. Nuevas Claves de Traduccion

Se agregaran las siguientes claves nuevas a los 3 archivos de idioma:

### Namespace `agents` (en `common.json`):
```
agents.welcomePrompt: "¿Que quieres hacer hoy?" / "What do you want to do today?" / "O que voce quer fazer hoje?"
agents.loginToChat: "Inicia sesion para chatear" / "Sign in to chat" / "Faca login para conversar"
agents.analyzing: "Analizando..." / "Analyzing..." / "Analisando..."
agents.writeOrAttach: "Escribe o adjunta archivos..." / "Type or attach files..." / "Escreva ou anexe arquivos..."
agents.selectToStart: "Selecciona un agente..." / "Select an agent..." / "Selecione um agente..."
agents.suggestions.adsOptimizer (array)
agents.suggestions.aiCrmSales (array)
agents.suggestions.default
```

### Namespace `widget`:
```
widget.configRequired, widget.selectAccount, widget.connectionRequired, widget.connectMeta
widget.loadError, widget.noData, widget.noMetricsData, widget.goalNotConfigured, widget.selectGoal
widget.accountLabel, widget.addWidget, widget.selectMetric, widget.selectType
widget.selectAccountOptional, widget.emptyCanvas, widget.loadingAccounts
widget.select.platform, widget.select.account, widget.select.type, widget.select.metric, widget.select.period
```

### Namespace `common` (nuevas):
```
common.configure, common.retry, common.refresh, common.next, common.saving, common.saveChanges
common.deleting, common.andMore
```

### Namespace `projects` (nuevas):
```
projects.moveToGeneral, projects.moveDescription, projects.deleteProject
```

---

## 3. Empty States Mejorados

### Dashboard (ya implementado, pero refinar):
- `GoalsSummaryWidget`: Ya muestra `goalsEmpty`. Agregar un boton "Ir a Proyectos" que navegue a crear un proyecto.
- `RecentActivityWidget`: Ya muestra `activityEmpty`. Agregar sugerencia: "Ve a Agentes AI para iniciar tu primera auditoria."
- `ConnectivityWidget`: Agregar CTA "Conectar" para cada plataforma desconectada.

### Agents page:
- Ya muestra `selectPrompt`. Sin cambios necesarios.

### OmnichannelPerformance:
- Ya retorna `null` si no hay plataformas activas. Agregar un estado vacio amigable con icono y texto traducido en lugar de desaparecer.

---

## 4. Responsividad del Widget de Rendimiento Omnicanal

- El grid de KPIs (`grid-cols-3`) necesita `grid-cols-1 sm:grid-cols-3` para pantallas pequenas.
- El grafico de barras ya usa `ResponsiveContainer` (correcto).
- El widget grid del Dashboard (`grid-cols-1 md:grid-cols-3`) ya es responsivo (correcto).

---

## 5. Navegacion y Rutas

**Estado actual (correcto):**
- Dashboard -> `/` (widgets analiticos) ✓
- Agentes AI -> `/agents` (consola de chat) ✓
- Proyectos -> `/project/:id` (detalle) ✓
- Sidebar redirige conversaciones a `/agents` ✓

**Sin cambios necesarios en rutas.**

---

## 6. Perfil en Sidebar

El bloque de perfil ya esta anclado al fondo con `shrink-0` y el selector de idioma esta accesible en Settings. Sin cambios estructurales necesarios.

---

## Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/i18n/locales/es/common.json` | Agregar ~30 nuevas claves |
| `src/i18n/locales/en/common.json` | Agregar ~30 nuevas claves |
| `src/i18n/locales/pt/common.json` | Agregar ~30 nuevas claves |
| `src/pages/Agents.tsx` | Reemplazar titulo hardcoded con t() |
| `src/components/CommandConsole.tsx` | Reemplazar ~10 textos con t() |
| `src/components/dashboards/DashboardWidget.tsx` | Reemplazar ~12 textos con t(), agregar useTranslation |
| `src/components/dashboards/WidgetSelector.tsx` | Reemplazar ~5 textos con t() |
| `src/components/dashboards/WidgetSettings.tsx` | Reemplazar ~6 placeholders con t() |
| `src/components/dashboards/RenameDashboardDialog.tsx` | Reemplazar 2 textos |
| `src/components/dashboards/DashboardCanvas.tsx` | Reemplazar 1 texto |
| `src/components/projects/ProjectGoalsEditor.tsx` | Reemplazar 2 textos |
| `src/components/DeleteProjectDialog.tsx` | Reemplazar 3 textos |
| `src/components/ConversationItemMenu.tsx` | Reemplazar 2 textos |
| `src/components/RenameProjectDialog.tsx` | Reemplazar 2 textos |
| `src/components/dashboard/GoalsSummaryWidget.tsx` | Reemplazar 1 texto, agregar CTA |
| `src/components/dashboard/RecentActivityWidget.tsx` | Mejorar empty state |
| `src/components/OmnichannelPerformance.tsx` | KPI grid responsivo, tooltip i18n, empty state |

---

## Verificacion Post-Implementacion

- [ ] Cambiar idioma a EN: todos los textos se traducen (0 textos en espanol visible)
- [ ] Cambiar idioma a PT: todos los textos se traducen
- [ ] Empty states muestran mensajes amigables con CTAs
- [ ] No hay valores NaN o null visibles en graficos o KPIs
- [ ] OmnichannelPerformance se redimensiona correctamente al colapsar/expandir sidebar
- [ ] Widgets del Dashboard no se solapan en resolucion tablet (1024px)
- [ ] Navegacion: Dashboard (/) = analitico, Agentes (/agents) = chat
- [ ] Boton de retroceso del navegador funciona entre vistas
