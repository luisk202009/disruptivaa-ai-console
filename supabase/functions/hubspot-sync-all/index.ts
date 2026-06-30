import {
  corsHeaders,
  requireAdmin,
  serviceClient,
  normalizeMapping,
  splitProperties,
  upsertContact,
  upsertCompany,
  associateContactCompany,
} from "../_shared/hubspot.ts";

// Sincroniza TODOS los leads. Para cada uno upsert de contacto + empresa + asociación.
async function syncOne(sb: any, lead: any, mapping: Record<string, any>) {
  const { contact, company } = splitProperties(lead, mapping);
  const events: any[] = [];

  if (!contact.email && !lead.hubspot_contact_id) {
    return {
      counters: { create: 0, update: 0, skip: 1, error: 0 },
      events: [{ object_type: "contact", action: "skip", error_message: "Sin email" }],
    };
  }

  const counters = { create: 0, update: 0, skip: 0, error: 0 };
  let contactId: string | null = lead.hubspot_contact_id || null;
  let companyId: string | null = lead.hubspot_company_id || null;

  try {
    const wasUpdate = !!contactId;
    const r = await upsertContact(contact, contactId);
    contactId = r.id;
    counters[wasUpdate ? "update" : "create"]++;
    events.push({
      object_type: "contact",
      action: wasUpdate ? "update" : "create",
      hubspot_contact_id: contactId,
    });
  } catch (e) {
    counters.error++;
    events.push({ object_type: "contact", action: "error", error_message: (e as Error).message });
  }

  if (Object.keys(company).length > 0) {
    try {
      const wasUpdate = !!companyId;
      const r = await upsertCompany(company, companyId);
      if (r) {
        companyId = r.id;
        events.push({
          object_type: "company",
          action: wasUpdate ? "update" : "create",
          hubspot_company_id: companyId,
        });
        if (contactId) {
          try {
            await associateContactCompany(contactId, companyId);
          } catch (e) {
            events.push({
              object_type: "company",
              action: "error",
              error_message: `Asociación: ${(e as Error).message}`,
            });
          }
        }
      }
    } catch (e) {
      events.push({ object_type: "company", action: "error", error_message: (e as Error).message });
    }
  }

  const patch: any = {};
  if (contactId && contactId !== lead.hubspot_contact_id) patch.hubspot_contact_id = contactId;
  if (companyId && companyId !== lead.hubspot_company_id) patch.hubspot_company_id = companyId;
  if (Object.keys(patch).length) await sb.from("leads").update(patch).eq("id", lead.id);

  return { counters, events, contactId, companyId };
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

    const mapping = normalizeMapping(config.field_mapping || {});
    const { data: leads } = await sb.from("leads").select("*").order("created_at", { ascending: true });
    if (!leads?.length) {
      return new Response(
        JSON.stringify({ ok: true, total: 0, created: 0, updated: 0, skipped: 0, errors: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const totals = { created: 0, updated: 0, skipped: 0, errors: 0 };
    const logs: any[] = [];

    for (const lead of leads) {
      const r = await syncOne(sb, lead, mapping);
      totals.created += r.counters.create;
      totals.updated += r.counters.update;
      totals.skipped += r.counters.skip;
      totals.errors += r.counters.error;

      for (const ev of r.events) {
        logs.push({
          lead_id: lead.id,
          hubspot_contact_id: ev.hubspot_contact_id ?? r.contactId ?? lead.hubspot_contact_id ?? null,
          object_type: ev.object_type,
          action: ev.action,
          error_message: ev.error_message ?? null,
        });
      }

      // Throttle ~12 req/s
      await new Promise((res) => setTimeout(res, 80));
    }

    if (logs.length) await sb.from("hubspot_sync_log").insert(logs);
    await sb.from("hubspot_sync_config")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", config.id);

    return new Response(JSON.stringify({ ok: true, total: leads.length, ...totals }), {
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
