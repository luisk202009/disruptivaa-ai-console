import { corsHeaders, getHubSpotHeaders, requireAdmin, HUBSPOT_GATEWAY } from "../_shared/hubspot.ts";

// Devuelve propiedades de contacts y companies para construir el selector de mapeo.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdmin(req);
    const headers = getHubSpotHeaders();

    const [contactsRes, companiesRes] = await Promise.all([
      fetch(`${HUBSPOT_GATEWAY}/crm/v3/properties/contacts`, { headers }),
      fetch(`${HUBSPOT_GATEWAY}/crm/v3/properties/companies`, { headers }),
    ]);

    if (!contactsRes.ok) {
      const t = await contactsRes.text();
      return new Response(
        JSON.stringify({ ok: false, status: contactsRes.status, error: t }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const map = (json: any) =>
      (json.results || []).map((p: any) => ({
        name: p.name,
        label: p.label,
        type: p.type,
        groupName: p.groupName,
      }));

    const contacts = map(await contactsRes.json());
    const companies = companiesRes.ok ? map(await companiesRes.json()) : [];

    return new Response(
      JSON.stringify({ ok: true, contacts, companies }),
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
