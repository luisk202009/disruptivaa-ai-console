import {
  corsHeaders,
  getHubSpotHeaders,
  requireAdmin,
  serviceClient,
  buildHubSpotProperties,
  HUBSPOT_GATEWAY,
} from "../_shared/hubspot.ts";

// Sincroniza TODOS los leads en lote. Usa batch upsert por email para eficiencia,
// pero por simplicidad y trazabilidad por lead lo hacemos uno a uno con un pequeño
// throttle para no exceder rate limits (100 req/10s en HubSpot).
async function syncOne(sb: any, lead: any, mapping: Record<string, string>, headers: HeadersInit) {
  const properties = buildHubSpotProperties(lead, mapping);
  if (!properties.email && !lead.hubspot_contact_id) {
    return { action: "skip", error: "Sin email" };
  }

  let contactId: string | null = lead.hubspot_contact_id;

  if (!contactId && properties.email) {
    const lookup = await fetch(
      `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts/${encodeURIComponent(properties.email)}?idProperty=email`,
      { headers },
    );
    if (lookup.ok) contactId = (await lookup.json()).id;
    else await lookup.text();
  }

  let action: "create" | "update" = contactId ? "update" : "create";
  const url = contactId
    ? `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts/${contactId}`
    : `${HUBSPOT_GATEWAY}/crm/v3/objects/contacts`;

  const res = await fetch(url, {
    method: contactId ? "PATCH" : "POST",
    headers,
    body: JSON.stringify({ properties }),
  });
  const text = await res.text();
  if (!res.ok) return { action: "error", error: `HubSpot ${res.status}: ${text}` };

  const json = JSON.parse(text);
  const newId = json.id || contactId;
  if (newId && newId !== lead.hubspot_contact_id) {
    await sb.from("leads").update({ hubspot_contact_id: newId }).eq("id", lead.id);
  }
  return { action, hubspot_contact_id: newId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdmin(req);
    const sb = serviceClient();

    const { data: config } = await sb
      .from("hubspot_sync_config")
      .select("id, enabled, field_mapping")
      .limit(1)
      .maybeSingle();

    if (!config?.enabled) {
      return new Response(JSON.stringify({ ok: false, error: "Integración deshabilitada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: leads } = await sb.from("leads").select("*").order("created_at", { ascending: true });
    if (!leads?.length) {
      return new Response(JSON.stringify({ ok: true, total: 0, created: 0, updated: 0, skipped: 0, errors: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = getHubSpotHeaders();
    const counters = { total: leads.length, created: 0, updated: 0, skipped: 0, errors: 0 };
    const logs: any[] = [];

    for (const lead of leads) {
      const r = await syncOne(sb, lead, config.field_mapping || {}, headers);
      if (r.action === "create") counters.created++;
      else if (r.action === "update") counters.updated++;
      else if (r.action === "skip") counters.skipped++;
      else counters.errors++;

      logs.push({
        lead_id: lead.id,
        hubspot_contact_id: r.hubspot_contact_id ?? lead.hubspot_contact_id ?? null,
        action: r.action,
        error_message: r.error ?? null,
      });

      // Throttle: 80ms ≈ 12 req/s, holgado bajo el límite de HubSpot
      await new Promise((res) => setTimeout(res, 80));
    }

    if (logs.length) await sb.from("hubspot_sync_log").insert(logs);
    await sb.from("hubspot_sync_config").update({ last_sync_at: new Date().toISOString() }).eq("id", config.id);

    return new Response(JSON.stringify({ ok: true, ...counters }), {
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
