

# Plan: Completar Internacionalización (i18n) - Gaps Restantes

## Estado Actual

La infraestructura de i18n ya esta implementada al 80%. Este plan cierra los gaps restantes.

| Componente | Estado Actual |
|------------|---------------|
| i18next + react-i18next | Configurado |
| LanguageSelector en Settings | Funcionando |
| Persistencia en profiles table | Funcionando |
| Sidebar, Agents, ProjectDetail | Traducidos |
| Edge Function language detection | Implementado |
| **Connections.tsx** | **Sin traducir** |
| **GoogleCallback / MetaCallback** | **Toasts hardcoded** |
| **Settings.tsx toasts** | **Hardcoded en espanol** |
| **ExportReportDialog toasts** | **Hardcoded en espanol** |
| **Connections.tsx date-fns locale** | **Hardcoded en espanol** |
| **Edge Function system prompt** | **Solo en espanol** |

---

## Cambios a Implementar

### 1. Traducir `src/pages/Connections.tsx`

- Agregar `useTranslation` hook
- Crear claves en namespace `common` para:
  - Titulo de pagina, descripciones de plataformas
  - Estados de conexion ("Conectado", "Desconectado")
  - Toasts de exito/error
  - Boton "Gestionar", "Desconectar", etc.
- Reemplazar `date-fns/locale/es` hardcodeado por locale dinamico segun idioma

### 2. Traducir Toasts en `GoogleCallback.tsx` y `MetaCallback.tsx`

- Reemplazar mensajes hardcoded como "Cuenta de Google Ads vinculada correctamente" por `t("connections.googleSuccess")`
- Lo mismo para estados de error y carga

### 3. Traducir Toasts en `Settings.tsx`

- Lineas 40-42: reemplazar strings de toast por `t("settings.resetSuccess")` y `t("settings.resetError")`

### 4. Traducir `ExportReportDialog.tsx`

- Toasts "Informe copiado al portapapeles", "Error al copiar", "Informe descargado"

### 5. Adaptar Edge Function System Prompt al Idioma

**Archivo:** `supabase/functions/disruptivaa-agent/index.ts`

Actualmente el prompt `ANALYST_PERSONALITY` esta 100% en espanol. El cambio:
- Crear versiones del prompt base para cada idioma (ES, EN, PT)
- Seleccionar el prompt correcto segun `userLanguage` ya disponible en la funcion
- Adaptar tambien `RESPONSE_FORMAT_RULES` y `OMNICHANNEL_INSTRUCTIONS`
- Las etiquetas de metricas en `goalsContext` (lineas 455-468) deben ser dinamicas

### 6. Actualizar Archivos de Traduccion

**Nuevas claves a agregar en los 3 idiomas:**

```
connections.title
connections.subtitle
connections.metaDescription
connections.googleDescription
connections.tiktokDescription
connections.connected
connections.disconnected
connections.manage
connections.disconnect
connections.connectSuccess
connections.connectError
connections.disconnectSuccess
connections.disconnectError
connections.googleSuccess
connections.metaSuccess
connections.connectedAgo
settings.resetSuccess
settings.resetError
exportReport.copied
exportReport.copyError
exportReport.downloaded
```

---

## Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/pages/Connections.tsx` | Modificar | Agregar i18n completo |
| `src/pages/GoogleCallback.tsx` | Modificar | Traducir toasts |
| `src/pages/MetaCallback.tsx` | Modificar | Traducir toasts |
| `src/pages/Settings.tsx` | Modificar | Traducir toasts |
| `src/components/dashboards/ExportReportDialog.tsx` | Modificar | Traducir toasts |
| `supabase/functions/disruptivaa-agent/index.ts` | Modificar | Prompts multilingues |
| `src/i18n/locales/es/common.json` | Modificar | Nuevas claves |
| `src/i18n/locales/en/common.json` | Modificar | Nuevas claves |
| `src/i18n/locales/pt/common.json` | Modificar | Nuevas claves |

---

## Verificacion Post-Implementacion

- Cambiar idioma a ingles y verificar que Connections, toasts y callbacks se muestren en ingles
- Cambiar a portugues y verificar lo mismo
- Enviar un mensaje al agente IA en ingles y confirmar que responde en ingles
- Verificar que date-fns muestre fechas en el idioma correcto en Connections

