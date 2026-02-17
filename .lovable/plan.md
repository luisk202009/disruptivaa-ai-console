

# Plan: Vista de Servicios del Cliente Dinamica (Tarea 4, Sprint 6)

## Resumen

Modificar el Dashboard principal para mostrar dos secciones: los agentes AI existentes y un nuevo grid de "Ecosistema Digital" con las ServiceCards de los websites asignados a la empresa del usuario. Incluye un nuevo componente `ServiceCard` con animaciones Framer Motion y la iconografia por tipo de sitio.

---

## Cambios Detallados

### 1. Instalar `framer-motion`

Se necesita agregar la dependencia (no esta instalada actualmente).

### 2. Actualizar `src/hooks/useUserProfile.ts`

El tipo `UserProfile` aun no incluye `role` ni `company_id`. Se actualizara:

```typescript
export interface UserProfile {
  id: string;
  language: SupportedLanguage;
  role: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}
```

### 3. Crear `src/components/ServiceCard.tsx`

Componente reutilizable con:
- Props: `url`, `siteType` ('Landing' | 'Website' | 'Ecommerce'), `companyColor` (opcional)
- Iconografia segun tipo:
  - `Ecommerce` -> `ShoppingBag`
  - `Website` -> `Globe`
  - `Landing` -> `Layout`
- Fondo negro con borde sutil (`border-white/10`)
- Tipografia Fira Sans
- Al hacer clic: `window.open(url, '_blank')`
- Animacion Framer Motion: `whileHover={{ scale: 1.03 }}` con transicion suave
- Badge con el tipo de sitio
- Boton/link "Ver Sitio" con acento Electric Blue (#00A3FF)

### 4. Modificar `src/components/Dashboard.tsx`

Cambios principales:
- Importar `useUserProfile` para obtener `company_id`
- Importar `useQuery` para consultar `company_websites` filtrado por `company_id`
- Importar `ServiceCard` y los agentes de `agentDefinitions`
- Reestructurar el layout del `main` en dos secciones:
  - **Seccion superior**: "Mis Agentes de IA" — grid con los agentes existentes (`DISRUPTIVAA_AGENTS`) usando `AgentCard`
  - **Seccion inferior**: "Ecosistema Digital" — grid de `ServiceCard` con los websites de la empresa
- Mantener los widgets existentes (OmnichannelPerformance, SmartAlerts, etc.) debajo
- Si no hay `company_id` o no hay websites, mostrar un mensaje vacio elegante
- Usar `useAgents` hook para obtener el estado de los agentes

### 5. Traducciones (i18n)

Agregar claves en `dashboard` namespace:

| Clave | ES | EN | PT |
|-------|----|----|-----|
| `dashboard.myAgents` | Mis Agentes de IA | My AI Agents | Meus Agentes de IA |
| `dashboard.digitalEcosystem` | Ecosistema Digital | Digital Ecosystem | Ecossistema Digital |
| `dashboard.viewSite` | Ver Sitio | View Site | Ver Site |
| `dashboard.contractedServices` | Servicios Contratados | Contracted Services | Servicos Contratados |
| `dashboard.noWebsites` | No hay sitios asignados a tu empresa. | No websites assigned to your company. | Nenhum site atribuido a sua empresa. |

---

## Resumen de Archivos

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/ServiceCard.tsx` | **Crear** | Card con icono, tipo, URL y animacion hover |
| `src/components/Dashboard.tsx` | **Modificar** | Layout de 2 secciones: agentes + ecosistema digital |
| `src/hooks/useUserProfile.ts` | **Modificar** | Agregar role y company_id al tipo |
| `src/i18n/locales/es/common.json` | **Modificar** | Claves dashboard.myAgents, digitalEcosystem, etc. |
| `src/i18n/locales/en/common.json` | **Modificar** | Mismas claves en ingles |
| `src/i18n/locales/pt/common.json` | **Modificar** | Mismas claves en portugues |
| `package.json` | **Modificar** | Agregar framer-motion |

## Seguridad

- La consulta a `company_websites` ya esta protegida por RLS: los usuarios solo pueden ver websites de su propia empresa (politica "Users can view assigned websites")
- No se requiere migracion de base de datos

## Secuencia de Implementacion

1. Instalar framer-motion
2. Actualizar useUserProfile con role/company_id
3. Crear ServiceCard.tsx
4. Modificar Dashboard.tsx con el nuevo layout
5. Agregar traducciones en los 3 idiomas

