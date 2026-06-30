import { corsHeaders, getHubSpotHeaders, requireAdmin, HUBSPOT_GATEWAY } from "../_shared/hubspot.ts";

// Devuelve la lista de propiedades del objeto contacts para construir el selector de mapeo.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdmin(req);

    const res = await fetch(`${HUBSPOT_GATEWAY}/crm/v3/properties/contacts`, {
      headers: getHubSpotHeaders(),
    });
    const body = await res.text();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, status: res.status, error: body }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = JSON.parse(body);
    // Retornamos sólo lo esencial para la UI
    const properties = (json.results || []).map((p: any) => ({
      name: p.name,
      label: p.label,
      type: p.type,
      groupName: p.groupName,
    }));

    return new Response(
      JSON.stringify({ ok: true, properties }),
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
