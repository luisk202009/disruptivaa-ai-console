import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const buildWaUrl = (phone: string, message: string | null, type: string) => {
  if (type === "catalog") return `https://wa.me/c/${phone}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${phone}${text}`;
};

const detectDevice = (ua: string): string => {
  const u = ua.toLowerCase();
  if (/mobile|iphone|android|ipad/.test(u)) return "mobile";
  if (/tablet/.test(u)) return "tablet";
  return "desktop";
};

const hashIp = async (ip: string): Promise<string> => {
  const data = new TextEncoder().encode(ip + "::wa-redirect-salt");
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Path looks like /wa-redirect/{slug}
    const parts = url.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1];

    if (!slug || slug === "wa-redirect") {
      return new Response("Slug requerido", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: link, error } = await supabase
      .from("whatsapp_links")
      .select("id, phone, message, link_type, is_active")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !link || !link.is_active) {
      return new Response("Link no encontrado o inactivo", {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Track click (best-effort, don't block redirect)
    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const ua = req.headers.get("user-agent") || "";
      const referrer = req.headers.get("referer");
      const country = req.headers.get("cf-ipcountry") || null;

      const ipHash = await hashIp(ip);

      await supabase.from("whatsapp_link_clicks").insert({
        link_id: link.id,
        referrer,
        country,
        device_type: detectDevice(ua),
        ip_hash: ipHash,
      });
    } catch (e) {
      console.error("click tracking failed", e);
    }

    const target = buildWaUrl(link.phone, link.message, link.link_type);

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: target,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("wa-redirect error", err);
    return new Response("Error interno", { status: 500, headers: corsHeaders });
  }
});
