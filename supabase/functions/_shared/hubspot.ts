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

// Valida que el usuario sea admin. Devuelve { userId } o lanza Response 401/403
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

// Convierte un lead de la BD en propiedades HubSpot según el mapeo
export function buildHubSpotProperties(
  lead: Record<string, any>,
  mapping: Record<string, string>,
): Record<string, string> {
  const props: Record<string, string> = {};
  for (const [leadField, hsField] of Object.entries(mapping)) {
    if (!hsField || hsField === "__none__") continue;
    const value = lead[leadField];
    if (value === null || value === undefined || value === "") continue;

    // Caso especial: name → firstname + lastname
    if (leadField === "name" && typeof value === "string") {
      const parts = value.trim().split(/\s+/);
      props.firstname = parts[0];
      if (parts.length > 1) props.lastname = parts.slice(1).join(" ");
      continue;
    }

    props[hsField] = typeof value === "string" ? value : String(value);
  }
  return props;
}
