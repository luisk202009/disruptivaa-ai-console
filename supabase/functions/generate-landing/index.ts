import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://disruptivaa.lovable.app',
  'https://agentes.disruptivaa.com',
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && (
    ALLOWED_ORIGINS.includes(requestOrigin) ||
    requestOrigin.endsWith('.lovable.app') ||
    requestOrigin.endsWith('.lovable.dev') ||
    requestOrigin.endsWith('.lovableproject.com') ||
    requestOrigin.endsWith('.disruptivaa.com') ||
    requestOrigin === 'http://localhost:5173' ||
    requestOrigin === 'http://localhost:3000'
  ) ? requestOrigin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Credentials': 'true',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { companyName, brandColor, objective, tone, language, adContext, additionalContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langMap: Record<string, string> = {
      es: "español", en: "English", pt: "português"
    };
    const lang = langMap[language] || "español";

    const systemPrompt = `You are a world-class conversion copywriter and landing page architect. Generate compelling sales landing page content in ${lang}. The company is "${companyName}" with brand color ${brandColor}. The landing objective is "${objective}" and the tone should be "${tone}". ${adContext ? `Top-performing ad context: ${adContext}` : ""} ${additionalContext ? `Additional context: ${additionalContext}` : ""} Use the generate_landing_structure tool to return the structured content.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a high-converting landing page structure for "${companyName}". Objective: ${objective}. Tone: ${tone}. Language: ${lang}.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_landing_structure",
              description: "Return the complete landing page structure with all sections",
              parameters: {
                type: "object",
                properties: {
                  hero: {
                    type: "object",
                    properties: {
                      headline: { type: "string" },
                      subheadline: { type: "string" },
                      cta_text: { type: "string" },
                    },
                    required: ["headline", "subheadline", "cta_text"],
                  },
                  benefits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        icon: { type: "string", enum: ["zap", "shield", "trending-up", "target", "clock", "star", "heart", "check-circle"] },
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["icon", "title", "description"],
                    },
                  },
                  social_proof: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        quote: { type: "string" },
                        author: { type: "string" },
                        role: { type: "string" },
                      },
                      required: ["quote", "author", "role"],
                    },
                  },
                  faq: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                    },
                  },
                  final_cta: {
                    type: "object",
                    properties: {
                      headline: { type: "string" },
                      cta_text: { type: "string" },
                    },
                    required: ["headline", "cta_text"],
                  },
                },
                required: ["hero", "benefits", "social_proof", "faq", "final_cta"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_landing_structure" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sections = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ sections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
