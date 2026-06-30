import {
  corsHeaders,
  getHubSpotHeaders,
  requireAdmin,
  HUBSPOT_GATEWAY,
} from "../_shared/hubspot.ts";

// Crea (si faltan) las propiedades personalizadas de Disruptivaa en HubSpot.
// Idempotente: si la propiedad ya existe, la API devuelve 409 y lo tratamos como OK.

interface PropertyDef {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  groupName: string;
  description?: string;
  options?: { label: string; value: string }[];
}

const CONTACT_PROPS: PropertyDef[] = [
  {
    name: "disruptivaa_fit_score",
    label: "Lead Fit Score (Disruptivaa)",
    type: "number",
    fieldType: "number",
    groupName: "contactinformation",
    description: "Puntaje de calificación del lead (0-10).",
  },
  {
    name: "disruptivaa_nicho",
    label: "Nicho (Disruptivaa)",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
  },
  {
    name: "disruptivaa_servicios",
    label: "Servicios de interés (Disruptivaa)",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
  },
  {
    name: "disruptivaa_status",
    label: "Estado interno (Disruptivaa)",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
  },
  {
    name: "disruptivaa_source",
    label: "Origen (Disruptivaa)",
    type: "string",
    fieldType: "text",
    groupName: "contactinformation",
  },
  {
    name: "disruptivaa_notes",
    label: "Notas internas (Disruptivaa)",
    type: "string",
    fieldType: "textarea",
    groupName: "contactinformation",
  },
];

async function ensureProperty(object: "contacts" | "companies", prop: PropertyDef, headers: HeadersInit) {
  const res = await fetch(`${HUBSPOT_GATEWAY}/crm/v3/properties/${object}`, {
    method: "POST",
    headers,
    body: JSON.stringify(prop),
  });
  if (res.ok) return { name: prop.name, status: "created" };
  const text = await res.text();
  if (res.status === 409) return { name: prop.name, status: "exists" };
  return { name: prop.name, status: "error", error: `${res.status}: ${text}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdmin(req);
    const headers = getHubSpotHeaders();

    const results: any[] = [];
    for (const prop of CONTACT_PROPS) {
      results.push({ object: "contacts", ...(await ensureProperty("contacts", prop, headers)) });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
