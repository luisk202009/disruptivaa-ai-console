# Plan: Arreglar sincronización HubSpot (Contactos + Empresas)

## Diagnóstico (de los logs reales de `hubspot_sync_log`)

Los leads no llegan porque HubSpot devuelve `400 VALIDATION_ERROR` por tres causas:

1. **Enums inválidos**:
   - `status` (lead) se mapea a `lifecyclestage`, pero envía `"oportunidad" / "invitado" / "finalizado"` — HubSpot solo acepta `subscriber, lead, marketingqualifiedlead, salesqualifiedlead, opportunity, customer, evangelist, other`.
   - `source` se mapea a `hs_analytics_source`, que solo acepta `ORGANIC_SEARCH, PAID_SEARCH, …`. Valores como `"manual" / "web"` se rechazan.
2. **Propiedades personalizadas inexistentes**: el mapeo por defecto apunta a `disruptivaa_fit_score`, `disruptivaa_nicho`, `disruptivaa_servicios`, etc., que nunca se crearon en el portal.
3. **Sin distinción Contacto vs Empresa**: hoy todo va al objeto `contacts`, así que `company` y `website` no crean la empresa en HubSpot ni la asocian. Por eso "Lextramit" no aparece como cuenta.

## Cambios propuestos

### 1. Modelo de mapeo enriquecido
Cambiar `field_mapping` de `Record<string, string>` a `Record<string, { property: string; object: "contact" | "company"; transform?: string }>`. Migración para reescribir el mapeo actual al nuevo formato (con `object: "contact"` por defecto y `company`/`website` → `"company"`).

### 2. Transformación de valores (catálogo cerrado)
Nuevo helper `transformValue(leadField, value)` en `_shared/hubspot.ts`:
- `status` → `lifecyclestage`: `nuevo→lead`, `waitlist→subscriber`, `oportunidad→opportunity`, `invitado→marketingqualifiedlead`, `cliente→customer`, `finalizado→other`.
- `source` → texto plano en propiedad custom `disruptivaa_source` (NO `hs_analytics_source`).
- `service_type` (array) → string separado por `;`.
- `fit_score` → número.

### 3. Auto-provisión de propiedades custom
Nueva edge function `hubspot-ensure-properties` (admin) que crea (si faltan) en el grupo `contactinformation` / `companyinformation`:
- Contact: `disruptivaa_fit_score` (number), `disruptivaa_nicho` (string), `disruptivaa_servicios` (string), `disruptivaa_status` (enumeration con los valores reales), `disruptivaa_source` (string), `disruptivaa_notes` (string).
- Botón **"Crear propiedades en HubSpot"** en el panel admin.

### 4. Sincronización dual Contact + Company
En `hubspot-sync-lead` y `hubspot-sync-all`:
1. Separar `properties` por objeto según el mapeo (`contact` vs `company`).
2. Upsert del Contact por `email` (igual que hoy).
3. Si hay props de Company y existe `company` (nombre) o `website` (dominio):
   - Buscar Company por `domain` (extraído del website) o por `name`.
   - Crear o actualizar y guardar `hubspot_company_id` en `leads` (nueva columna).
   - Crear asociación Contact ↔ Company (`PUT /crm/v3/objects/contacts/{id}/associations/companies/{id}/contact_to_company`).
4. Loguear ambas acciones en `hubspot_sync_log` (campo `object_type`).

### 5. UI de mapeo
En `AdminHubSpot.tsx`:
- Cada fila del mapeo añade un selector **Objeto** (`Contacto` / `Empresa`).
- Defaults sugeridos: `name/email/phone/notes/fit_score/status/source/niche/service_type → Contacto`, `company/website → Empresa`.
- El selector de propiedad filtra por objeto (cargar también `companies` properties en `hubspot-list-properties`).
- Banner explicativo y botón "Crear propiedades faltantes".

### 6. Auto-sync al crear lead manual
Ya invoca `hubspot-sync-lead`; queda cubierto al arreglar el backend. Verificar que `enabled && auto_sync` se respete.

## Esquema (migración)

- `ALTER TABLE leads ADD COLUMN hubspot_company_id text`.
- `ALTER TABLE hubspot_sync_log ADD COLUMN object_type text` (`contact` | `company`).
- `UPDATE hubspot_sync_config` para reescribir `field_mapping` al nuevo formato `{property, object}`.

## Archivos afectados

- `supabase/migrations/<nuevo>.sql`
- `supabase/functions/_shared/hubspot.ts` (split por objeto + transforms)
- `supabase/functions/hubspot-sync-lead/index.ts` (lógica Company + asociación)
- `supabase/functions/hubspot-sync-all/index.ts` (idem)
- `supabase/functions/hubspot-list-properties/index.ts` (acepta `?object=contacts|companies`)
- `supabase/functions/hubspot-ensure-properties/index.ts` (nueva)
- `supabase/config.toml` (registrar la nueva función con `verify_jwt = false`)
- `src/hooks/useHubSpotConfig.ts` (tipos del nuevo mapeo)
- `src/pages/admin/AdminHubSpot.tsx` (selector Objeto + botón crear propiedades)

## Resultado esperado

Tras aplicar: pulsar "Sincronizar todos los leads" creará Contactos (sin errores 400) y las Empresas asociadas con su dominio. Los leads nuevos se sincronizan al instante con la misma lógica.
