

# Sprint 8, Tarea 4: Multi-idioma Dinamico IA

## Estado Actual

El sistema de i18n ya tiene una base solida:
- `useUserProfile` ya persiste el idioma en `profiles.language` via Supabase y sincroniza con i18next
- `LanguageSelector` ya llama a `updateLanguage()` que hace UPDATE en la tabla `profiles`
- `disruptivaa-agent` ya detecta el idioma del usuario desde `profiles.language` y ajusta prompts
- `generate-landing` ya recibe el parametro `language` desde el frontend
- `send-branded-email` ya tiene traducciones embebidas y recibe `lang`

Lo que **falta** implementar:

### 1. Toast de exito al cambiar idioma
El `LanguageSelector` cambia el idioma pero no muestra feedback visual. Se necesita agregar un toast con el nombre del idioma seleccionado.

### 2. Deteccion automatica del idioma del navegador para nuevos usuarios
El `handle_new_user()` trigger en Supabase crea el perfil con `language = 'es'` por defecto. La deteccion real ocurre client-side via i18next `LanguageDetector`, pero no se persiste al perfil en la primera carga. Se necesita que al cargar el perfil por primera vez (sin idioma personalizado), se sincronice el idioma detectado por el navegador al perfil.

### 3. Textos hardcodeados en componentes

**ExportReportDialog.tsx** (PDF generation): Tiene headers de tabla hardcodeados en espanol:
- Linea 208: `"Widget"` (este es tecnico, OK)
- Linea 209: `"Metrica"`
- Linea 210: `"Periodo"`
- Linea 211: `"Cuenta"`

**CreateDashboardDialog.tsx**: Placeholder hardcodeado:
- Linea 202: `"Panel para monitorear el rendimiento de campanas..."`

**LandingBuilder y DashboardCanvas**: Ya estan correctamente internacionalizados con `t()`.

### 4. i18n en reportes PDF
El `ExportReportDialog` genera PDFs con textos en espanol fijo. Se necesita inyectar el idioma del usuario para que los headers de la tabla KPI se traduzcan.

## Cambios Planificados

### Archivo 1: `src/components/LanguageSelector.tsx`
- Agregar `useToast` y mostrar toast de exito al cambiar idioma: "Idioma actualizado a Espanol/English/Portugues"
- El toast usa el label nativo del idioma seleccionado

### Archivo 2: `src/hooks/useUserProfile.ts`
- En el `useEffect` que sincroniza idioma, agregar logica inversa: si el perfil tiene el idioma por defecto (`es`) y el usuario nunca lo cambio, y el navegador detecta otro idioma soportado, persistir ese idioma al perfil automaticamente (solo la primera vez)

### Archivo 3: `src/components/dashboards/ExportReportDialog.tsx`
- Reemplazar strings hardcodeados `"Metrica"`, `"Periodo"`, `"Cuenta"` con claves i18n
- Dado que la generacion PDF ocurre client-side, se puede usar `t()` directamente

### Archivo 4: `src/components/dashboards/CreateDashboardDialog.tsx`
- Reemplazar placeholder hardcodeado `"Panel para monitorear..."` con clave i18n

### Archivo 5-7: `src/i18n/locales/[es|en|pt]/common.json`
Nuevas claves:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `language.updated` | Idioma actualizado a | Language updated to | Idioma atualizado para |
| `exportReport.metricHeader` | Metrica | Metric | Metrica |
| `exportReport.periodHeader` | Periodo | Period | Periodo |
| `exportReport.accountHeader` | Cuenta | Account | Conta |
| `widget.dashboardDescPlaceholder` | Panel para monitorear el rendimiento de campanas... | Panel to monitor campaign performance... | Painel para monitorar o desempenho de campanhas... |

## Detalle Tecnico

### Toast de idioma
```typescript
// En LanguageSelector.tsx
const handleChange = (value: string) => {
  const selected = languages.find(l => l.code === value);
  updateLanguage(value as SupportedLanguage);
  toast({ title: `${t('language.updated')} ${selected?.label}` });
};
```

### Deteccion automatica (primera vez)
```typescript
// En useUserProfile.ts, dentro del useEffect existente
useEffect(() => {
  if (profile?.language && profile.language !== i18n.language) {
    i18n.changeLanguage(profile.language);
  }
  // Auto-detect for new users: if profile has default 'es' but browser prefers another supported lang
  if (profile && profile.language === 'es' && user) {
    const browserLang = navigator.language?.slice(0, 2);
    if ((browserLang === 'en' || browserLang === 'pt') && !localStorage.getItem('language_synced')) {
      localStorage.setItem('language_synced', 'true');
      // Don't auto-switch - just mark as synced. The i18next LanguageDetector already handles UI.
      // Only persist if user explicitly changes via LanguageSelector.
    }
  }
}, [profile?.language]);
```

Nota: Tras reflexion, la mejor estrategia es mas simple: i18next `LanguageDetector` ya detecta el idioma del navegador y lo muestra en la UI. Solo falta persistirlo al perfil cuando es la primera visita. Se hara un check: si `profile.language` es el default `'es'` y el idioma detectado por i18next es diferente (y soportado), hacer un `update` silencioso al perfil.

### PDF headers i18n
El componente `ExportReportDialog` ya importa `useTranslation`. Solo se necesita reemplazar los strings literales con llamadas a `t()`.

## Archivos Afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/LanguageSelector.tsx` | Toast de exito al cambiar idioma |
| `src/hooks/useUserProfile.ts` | Auto-sync idioma del navegador para nuevos usuarios |
| `src/components/dashboards/ExportReportDialog.tsx` | i18n en headers de tabla PDF |
| `src/components/dashboards/CreateDashboardDialog.tsx` | i18n en placeholder |
| `src/i18n/locales/es/common.json` | Nuevas claves |
| `src/i18n/locales/en/common.json` | Nuevas claves |
| `src/i18n/locales/pt/common.json` | Nuevas claves |

## Notas

- Las Edge Functions `generate-landing` y `disruptivaa-agent` ya reciben y usan el parametro de idioma correctamente
- `send-branded-email` ya tiene traducciones embebidas para ES/EN/PT
- `DashboardCanvas` y `LandingBuilder` ya estan completamente internacionalizados
- No se requieren cambios en la base de datos ni nuevas migraciones

