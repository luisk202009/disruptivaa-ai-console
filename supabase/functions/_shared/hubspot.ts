// Helpers compartidos para llamadas al gateway de HubSpot
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const HUBSPOT_GATEWAY = "https://connector-gateway.lovable.dev/hubspot";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function getHubSpotHeaders() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const hubspotKey = Deno.env.get("HUBSPOT_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY no configurada");
  if (!hubspotKey) throw new Error("HUBSPOT_API_KEY no configurada (conecta HubSpot)");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": hubspotKey,
    "Content-Type": "application/json",
  };
}

// Verifica que el usuario sea admin
export async function requireAdmin(req: Request): Promise<{ userId: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = data.claims.sub as string;
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleRow) {
    throw new Response(JSON.stringify({ error: "Acceso solo para administradores" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return { userId };
}

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ===================== Tipos del nuevo mapeo =====================
export type ObjectType = "contact" | "company";
export interface MappingEntry {
  property: string;
  object: ObjectType;
}
export type FieldMapping = Record<string, MappingEntry | string>;

// Normaliza el mapeo (acepta el formato legacy `string` y lo trata como contacto)
export function normalizeMapping(raw: FieldMapping): Record<string, MappingEntry> {
  const out: Record<string, MappingEntry> = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (!v) continue;
    if (typeof v === "string") {
      if (!v || v === "__none__") continue;
      out[k] = { property: v, object: "contact" };
    } else if (v.property && v.property !== "__none__") {
      out[k] = { property: v.property, object: v.object || "contact" };
    }
  }
  return out;
}

// ===================== Catálogos / transformaciones =====================
// Mapa de status del lead → lifecyclestage estándar de HubSpot
const LIFECYCLE_MAP: Record<string, string> = {
  nuevo: "lead",
  new: "lead",
  contactado: "lead",
  waitlist: "subscriber",
  oportunidad: "opportunity",
  invitado: "marketingqualifiedlead",
  cliente: "customer",
  finalizado: "other",
};

function transformValue(leadField: string, hsProperty: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;

  // status → lifecyclestage requiere mapeo estricto
  if (hsProperty === "lifecyclestage") {
    const key = String(value).toLowerCase().trim();
    return LIFECYCLE_MAP[key] || "lead";
  }

  // Listas de servicios → string ";" separados
  if (leadField === "service_type" && Array.isArray(value)) {
    return value.join("; ");
  }

  // fit_score → número como string
  if (typeof value === "number") return String(value);

  // website (limpieza ligera): si la propiedad es 'domain', quedarse solo con el host
  if (hsProperty === "domain" && typeof value === "string") {
    try {
      const url = value.includes("://") ? value : `https://${value}`;
      const host = new URL(url).hostname.replace(/^www\./, "");
      return host;
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) return value.join("; ");
  return typeof value === "string" ? value : String(value);
}

// Construye dos bolsas de propiedades: contacto y empresa
export function splitProperties(
  lead: Record<string, any>,
  mapping: Record<string, MappingEntry>,
): { contact: Record<string, string>; company: Record<string, string> } {
  const contact: Record<string, string> = {};
  const company: Record<string, string> = {};

  for (const [leadField, entry] of Object.entries(mapping)) {
    const value = lead[leadField];
    if (value === null || value === undefined || value === "") continue;

    // Caso especial: name → firstname + lastname en HubSpot
    if (leadField === "name" && typeof value === "string" && entry.object === "contact") {
      const parts = value.trim().split(/\s+/);
      contact.firstname = parts[0];
      if (parts.length > 1) contact.lastname = parts.slice(1).join(" ");
      continue;
    }

    const transformed = transformValue(leadField, entry.property, value);
    if (transformed === null) continue;

    if (entry.object === "company") company[entry.property] = transformed;
    else contact[entry.property] = transformed;
  }

  return { contact, company };
}

// ===================== Operaciones HubSpot =====================
export async function upsertContact(
  properties: Record<string, string>,
  knownId: string | null,
): Promise<{ id: string }> {
  const headers = getHubSpotHeaders();
  let id = knownId;

  if (!id && properties.email) {
    const lookup = await fetch(
      `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts/${encodeURIComponent(properties.email)}?idProperty=email`,
      { headers },
    );
    if (lookup.ok) id = (await lookup.json()).id;
    else await lookup.text();
  }

  const url = id
    ? `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts/${id}`
    : `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts`;

  const res = await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers,
    body: JSON.stringify({ properties }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HubSpot contacts ${res.status}: ${text}`);
  const json = JSON.parse(text);
  return { id: json.id || id! };
}

export async function upsertCompany(
  properties: Record<string, string>,
  knownId: string | null,
): Promise<{ id: string } | null> {
  if (!properties.name && !properties.domain && !knownId) return null;
  const headers = getHubSpotHeaders();
  let id = knownId;

  // Buscar por domain primero, luego por name
  if (!id) {
    const criteria = properties.domain
      ? { propertyName: "domain", operator: "EQ", value: properties.domain }
      : { propertyName: "name", operator: "EQ", value: properties.name };

    const search = await fetch(`${HUBSPOT_GATEWAY}/crm/v3/objects/companies/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ filterGroups: [{ filters: [criteria] }], limit: 1 }),
    });
    if (search.ok) {
      const j = await search.json();
      if (j.results?.length) id = j.results[0].id;
    } else {
      await search.text();
    }
  }

  const url = id
    ? `${HUBSPOT_GATEWAY}/crm/v3/objects/companies/${id}`
    : `${HUBSPOT_GATEWAY}/crm/v3/objects/companies`;

  const res = await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers,
    body: JSON.stringify({ properties }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HubSpot companies ${res.status}: ${text}`);
  const json = JSON.parse(text);
  return { id: json.id || id! };
}

export async function associateContactCompany(contactId: string, companyId: string) {
  const headers = getHubSpotHeaders();
  const res = await fetch(
    `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/contact_to_company`,
    { method: "PUT", headers },
  );
  if (!res.ok && res.status !== 204) {
    const t = await res.text();
    throw new Error(`HubSpot association ${res.status}: ${t}`);
  } else {
    await res.text().catch(() => "");
  }
}
