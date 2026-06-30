import {
  corsHeaders,
  getHubSpotHeaders,
  requireAdmin,
  serviceClient,
  buildHubSpotProperties,
  HUBSPOT_GATEWAY,
} from "../_shared/hubspot.ts";

// Sincroniza un lead específico (o todos si lead_id viene null) hacia HubSpot Contacts.
// Estrategia:
//   1) Si lead.hubspot_contact_id existe → PATCH al contacto.
//   2) Si no, intentar buscar por email vía /crm/v3/objects/contacts/{email}?idProperty=email.
//   3) Si existe, PATCH y guardar id; si no, POST para crear.
async function syncLead(supabase: any, lead: any, mapping: Record<string, string>) {
  const properties = buildHubSpotProperties(lead, mapping);
  if (!properties.email && !lead.hubspot_contact_id) {
    return { action: "skip", error: "Lead sin email — no se puede sincronizar" };
  }

  const headers = getHubSpotHeaders();

  // Resolver ID del contacto en HubSpot
  let contactId: string | null = lead.hubspot_contact_id;

  if (!contactId && properties.email) {
    const lookup = await fetch(
      `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts/${encodeURIComponent(properties.email)}?idProperty=email`,
      { headers },
    );
    if (lookup.ok) {
      const json = await lookup.json();
      contactId = json.id;
    } else {
      await lookup.text(); // consumir body
    }
  }

  let action: "create" | "update" = "update";
  let response: Response;

  if (contactId) {
    response = await fetch(`${HUBSPOT_GATEWAY}/crm/v3/objects/contacts/${contactId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ properties }),
    });
  } else {
    action = "create";
    response = await fetch(`${HUBSPOT_GATEWAY}/crm/v3/objects/contacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ properties }),
    });
  }

  const text = await response.text();
  if (!response.ok) {
    return { action: "error", error: `HubSpot ${response.status}: ${text}` };
  }

  const json = JSON.parse(text);
  const newId = json.id || contactId;

  // Persistir el id en el lead
  if (newId && newId !== lead.hubspot_contact_id) {
    await supabase.from("leads").update({ hubspot_contact_id: newId }).eq("id", lead.id);
  }

  return { action, hubspot_contact_id: newId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdmin(req);
    const { lead_id } = await req.json().catch(() => ({}));
    if (!lead_id) {
      return new Response(JSON.stringify({ ok: false, error: "lead_id requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = serviceClient();

    // Verificar que la integración esté activa
    const { data: config } = await sb
      .from("hubspot_sync_config")
      .select("enabled, field_mapping")
      .limit(1)
      .maybeSingle();

    if (!config?.enabled) {
      return new Response(JSON.stringify({ ok: false, error: "Integración HubSpot deshabilitada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lead, error: leadErr } = await sb
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .maybeSingle();
    if (leadErr || !lead) {
      return new Response(JSON.stringify({ ok: false, error: "Lead no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await syncLead(sb, lead, config.field_mapping || {});

    await sb.from("hubspot_sync_log").insert({
      lead_id: lead.id,
      hubspot_contact_id: result.hubspot_contact_id ?? lead.hubspot_contact_id,
      action: result.action,
      error_message: result.error ?? null,
    });

    return new Response(
      JSON.stringify({ ok: result.action !== "error", result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
