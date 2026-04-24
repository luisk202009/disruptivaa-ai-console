import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://disruptivaa.lovable.app",
  "https://agentes.disruptivaa.com",
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin =
    requestOrigin &&
    (ALLOWED_ORIGINS.includes(requestOrigin) ||
      requestOrigin.endsWith(".lovable.app") ||
      requestOrigin.endsWith(".lovable.dev") ||
      requestOrigin.endsWith(".lovableproject.com") ||
      requestOrigin.endsWith(".disruptivaa.com") ||
      requestOrigin === "http://localhost:5173" ||
      requestOrigin === "http://localhost:3000")
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const email = (claimsData.claims.email as string | undefined)?.toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ error: "No email in token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Buscar grant pendiente para este email
    const { data: grant, error: grantErr } = await admin
      .from("pending_waitlist_grants")
      .select("id, lead_id, applied_at")
      .ilike("email", email)
      .is("applied_at", null)
      .maybeSingle();

    if (grantErr) {
      return new Response(JSON.stringify({ error: grantErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!grant) {
      // No grant pendiente: nada que hacer
      return new Response(JSON.stringify({ applied: false, reason: "no_grant" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener company_id del usuario
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();

    if (profErr || !profile?.company_id) {
      return new Response(
        JSON.stringify({
          applied: false,
          reason: "no_company",
          message: "El usuario aún no ha completado el onboarding.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Evitar doble suscripción si ya hay una activa para esta empresa
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("status", "active")
      .maybeSingle();

    if (existingSub) {
      // Marcar grant como aplicado para no reintentar
      await admin
        .from("pending_waitlist_grants")
        .update({ applied_at: new Date().toISOString() })
        .eq("id", grant.id);
      return new Response(
        JSON.stringify({ applied: false, reason: "already_subscribed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Buscar plan Waitlist Free Year
    const { data: plan, error: planErr } = await admin
      .from("plans")
      .select("id, name")
      .eq("name", "Waitlist Free Year")
      .maybeSingle();

    if (planErr || !plan) {
      return new Response(
        JSON.stringify({ error: "Waitlist Free Year plan not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date();
    const oneYear = new Date(now);
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    const { error: insertErr } = await admin.from("subscriptions").insert({
      company_id: profile.company_id,
      plan_id: plan.id,
      plan_name: plan.name,
      price: 0,
      currency: "USD",
      status: "active",
      billing_cycle: "yearly",
      starts_at: now.toISOString(),
      expires_at: oneYear.toISOString(),
    });

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("pending_waitlist_grants")
      .update({ applied_at: now.toISOString() })
      .eq("id", grant.id);

    return new Response(
      JSON.stringify({ applied: true, expires_at: oneYear.toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
