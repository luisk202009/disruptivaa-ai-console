import { corsHeaders, getHubSpotHeaders, requireAdmin, HUBSPOT_GATEWAY } from "../_shared/hubspot.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAdmin(req);

    const res = await fetch(`${HUBSPOT_GATEWAY}/account-info/v3/details`, {
      headers: getHubSpotHeaders(),
    });
    const body = await res.text();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, status: res.status, error: body }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, account: JSON.parse(body) }),
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
