import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
}

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

interface MetaInsights {
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
}

async function fetchMetaCampaigns(accessToken: string, accountId: string): Promise<{ campaigns: MetaCampaign[], insights: MetaInsights | null }> {
  try {
    // Fetch campaigns
    const campaignsUrl = `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`;
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    if (campaignsData.error) {
      console.error("Meta Campaigns API Error:", campaignsData.error);
      return { campaigns: [], insights: null };
    }

    // Fetch account insights (last 30 days)
    const insightsUrl = `https://graph.facebook.com/v18.0/${accountId}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,ctr&date_preset=last_30d&access_token=${accessToken}`;
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    
    let insights: MetaInsights | null = null;
    if (!insightsData.error && insightsData.data && insightsData.data.length > 0) {
      insights = insightsData.data[0];
    }

    return { 
      campaigns: campaignsData.data || [], 
      insights 
    };
  } catch (error) {
    console.error("Error fetching Meta data:", error);
    return { campaigns: [], insights: null };
  }
}

async function getMetaIntegration(supabaseAdmin: any, userId: string): Promise<{ access_token: string; account_ids: string[] } | null> {
  const { data, error } = await supabaseAdmin
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "meta_ads")
    .eq("status", "connected")
    .single();

  if (error || !data) {
    return null;
  }

  return data as { access_token: string; account_ids: string[] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, agentId, agentName, systemInstruction, chatId, knowledgePriority } = await req.json();
    
    console.log("📥 Request received:", { message, userId, agentId, agentName, chatId });

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build context based on agent type
    let contextMessage = "";
    let metaConnected = false;
    let metaData: { campaigns: MetaCampaign[], insights: MetaInsights | null } | null = null;

    // Check if ads-optimizer and Meta is connected
    if (agentId === "ads-optimizer" && userId) {
      const metaIntegration = await getMetaIntegration(supabaseAdmin, userId);
      
      if (metaIntegration && metaIntegration.access_token) {
        metaConnected = true;
        const accountIds = metaIntegration.account_ids || [];
        
        console.log("✅ Meta Ads connected. Fetching campaign data...");
        
        // Fetch real campaign data from the first account
        if (accountIds.length > 0) {
          metaData = await fetchMetaCampaigns(metaIntegration.access_token, accountIds[0]);
          console.log("📊 Meta data fetched:", { 
            campaignsCount: metaData.campaigns.length, 
            hasInsights: !!metaData.insights 
          });
        }

        // Build context with real data
        if (metaData && (metaData.campaigns.length > 0 || metaData.insights)) {
          contextMessage = `
IMPORTANTE: El usuario ya tiene su cuenta de Meta Ads conectada. NO le ofrezcas el servicio de "Configuración de cuenta ($80 USD)" ya que no lo necesita.

📊 DATOS REALES DE SUS CAMPAÑAS (últimos 30 días):
`;
          if (metaData.insights) {
            contextMessage += `
Métricas generales:
- Impresiones: ${parseInt(metaData.insights.impressions || "0").toLocaleString()}
- Alcance: ${parseInt(metaData.insights.reach || "0").toLocaleString()}
- Clics: ${parseInt(metaData.insights.clicks || "0").toLocaleString()}
- Gasto total: $${parseFloat(metaData.insights.spend || "0").toFixed(2)} USD
- CPC promedio: $${parseFloat(metaData.insights.cpc || "0").toFixed(2)}
- CPM promedio: $${parseFloat(metaData.insights.cpm || "0").toFixed(2)}
- CTR: ${parseFloat(metaData.insights.ctr || "0").toFixed(2)}%
`;
          }

          if (metaData.campaigns.length > 0) {
            contextMessage += `
Campañas activas (${metaData.campaigns.length} total):
`;
            metaData.campaigns.slice(0, 5).forEach((campaign, index) => {
              const budget = campaign.daily_budget 
                ? `$${(parseInt(campaign.daily_budget) / 100).toFixed(2)}/día` 
                : campaign.lifetime_budget 
                  ? `$${(parseInt(campaign.lifetime_budget) / 100).toFixed(2)} total`
                  : "Sin presupuesto definido";
              contextMessage += `${index + 1}. "${campaign.name}" - Estado: ${campaign.status} - Objetivo: ${campaign.objective} - Presupuesto: ${budget}\n`;
            });
          }

          contextMessage += `
Puedes analizar estos datos y dar recomendaciones específicas basadas en las métricas reales del usuario.
`;
        } else {
          contextMessage = `
El usuario tiene Meta Ads conectado pero no tiene campañas activas o datos recientes. 
Ofrécele ayuda para crear su primera campaña o analizar por qué no hay datos disponibles.
NO le ofrezcas el servicio de "Configuración de cuenta ($80 USD)" ya que su cuenta ya está conectada.
`;
        }
      } else {
        contextMessage = `
El usuario NO tiene Meta Ads conectado. Puedes ofrecerle los servicios de configuración según el PDF de servicios,
incluyendo la "Configuración de cuenta ($80 USD)" si es apropiado.
`;
      }
    }

    // Build the final system prompt
    const finalSystemInstruction = `${systemInstruction || "Eres un asistente experto de Disruptivaa."}

${contextMessage}

Responde siempre en español de manera profesional y concisa.`;

    console.log("🤖 Calling Lovable AI with context:", { metaConnected, hasCampaigns: metaData?.campaigns?.length || 0 });

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: finalSystemInstruction },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const agentResponse = aiData.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";
    
    console.log("✅ AI Response generated successfully");

    // Save assistant message to database with chat_id
    if (userId && chatId) {
      const { error: insertError } = await supabaseAdmin
        .from("agent_messages")
        .insert({
          content: agentResponse,
          role: "assistant",
          user_id: userId,
          chat_id: chatId,
        });

      if (insertError) {
        console.error("Error saving assistant message:", insertError);
      } else {
        console.log("💾 Assistant message saved with chat_id:", chatId);
      }
    }

    return new Response(
      JSON.stringify({ 
        text: agentResponse,
        metaConnected,
        campaignsCount: metaData?.campaigns?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error in disruptivaa-agent:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
