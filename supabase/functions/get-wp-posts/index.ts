const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const WP_URL = Deno.env.get("WP_URL");
    if (!WP_URL) {
      return new Response(JSON.stringify({ error: "WP_URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reqUrl = new URL(req.url);
    const slug = reqUrl.searchParams.get("slug");
    const page = reqUrl.searchParams.get("page") || "1";

    const wpUrl = new URL(`${WP_URL}/wp-json/wp/v2/posts`);
    wpUrl.searchParams.set("_embed", "");
    wpUrl.searchParams.set("per_page", "12");
    wpUrl.searchParams.set("page", page);
    if (slug) {
      wpUrl.searchParams.set("slug", slug);
    }

    const wpRes = await fetch(wpUrl.toString());
    const posts = await wpRes.json();
    const totalPages = wpRes.headers.get("X-WP-TotalPages") || "1";
    const total = wpRes.headers.get("X-WP-Total") || "0";

    return new Response(JSON.stringify({ posts, totalPages: Number(totalPages), total: Number(total) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
