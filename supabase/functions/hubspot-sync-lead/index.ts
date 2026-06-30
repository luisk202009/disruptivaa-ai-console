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

// Sincroniza un lead concreto a HubSpot: crea/actualiza el Contacto, opcionalmente
// la Empresa, y crea la asociación.
async function syncLead(sb: any, lead: any, mappingRaw: any) {
  const mapping = normalizeMapping(mappingRaw);
  const { contact, company } = splitProperties(lead, mapping);

  const logs: any[] = [];

  if (!contact.email && !lead.hubspot_contact_id) {
    return { ok: false, logs: [{ object_type: "contact", action: "skip", error_message: "Sin email" }] };
  }

  let contactId: string | null = lead.hubspot_contact_id || null;
  let companyId: string | null = lead.hubspot_company_id || null;

  // Contacto
  try {
    const result = await upsertContact(contact, contactId);
    const action = contactId ? "update" : "create";
    contactId = result.id;
    logs.push({ object_type: "contact", action, hubspot_contact_id: contactId });
  } catch (e) {
    logs.push({ object_type: "contact", action: "error", error_message: (e as Error).message });
  }

  // Empresa (si hay datos)
  if (Object.keys(company).length > 0) {
    try {
      const result = await upsertCompany(company, companyId);
      if (result) {
        const action = companyId ? "update" : "create";
        companyId = result.id;
        logs.push({ object_type: "company", action, hubspot_company_id: companyId });

        if (contactId && companyId) {
          try {
            await associateContactCompany(contactId, companyId);
          } catch (e) {
            logs.push({
              object_type: "company",
              action: "error",
              error_message: `Asociación falló: ${(e as Error).message}`,
            });
          }
        }
      }
    } catch (e) {
      logs.push({ object_type: "company", action: "error", error_message: (e as Error).message });
    }
  }

  // Persistir ids
  const patch: any = {};
  if (contactId && contactId !== lead.hubspot_contact_id) patch.hubspot_contact_id = contactId;
  if (companyId && companyId !== lead.hubspot_company_id) patch.hubspot_company_id = companyId;
  if (Object.keys(patch).length) await sb.from("leads").update(patch).eq("id", lead.id);

  const ok = !logs.some((l) => l.action === "error");
  return { ok, logs, contactId, companyId };
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

    const { data: lead } = await sb.from("leads").select("*").eq("id", lead_id).maybeSingle();
    if (!lead) {
      return new Response(JSON.stringify({ ok: false, error: "Lead no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await syncLead(sb, lead, config.field_mapping || {});

    if (result.logs.length) {
      await sb.from("hubspot_sync_log").insert(
        result.logs.map((l: any) => ({
          lead_id: lead.id,
          hubspot_contact_id: l.hubspot_contact_id ?? result.contactId ?? lead.hubspot_contact_id,
          object_type: l.object_type,
          action: l.action,
          error_message: l.error_message ?? null,
        })),
      );
    }

    return new Response(JSON.stringify({ ok: result.ok, result }), {
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
