import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://id-preview--qtjwzfbinsrmnvlsgvtw.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.some(allowed => 
    requestOrigin === allowed || requestOrigin.endsWith('.lovable.app') || requestOrigin.endsWith('.lovable.dev')
  ) ? requestOrigin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

interface FileData {
  name: string;
  type: string;
  size: number;
  content: string; // base64
}

async function fetchMetaCampaigns(accessToken: string, accountId: string): Promise<{ campaigns: MetaCampaign[], insights: MetaInsights | null }> {
  try {
    const campaignsUrl = `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${accessToken}`;
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    if (campaignsData.error) {
      console.error("Meta Campaigns API Error:", campaignsData.error);
      return { campaigns: [], insights: null };
    }

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

async function validateMetaToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
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

// Parse file content based on type
function parseFileContent(file: FileData): string {
  try {
    const decodedContent = atob(file.content);
    
    // For CSV files, return as-is (it's plain text)
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      return `\n📊 DATOS DEL ARCHIVO "${file.name}":\n${decodedContent}`;
    }
    
    // For Excel files, we can't fully parse in edge function but can extract some text
    if (file.type.includes('spreadsheet') || file.type.includes('excel') || 
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Extract readable strings from the binary content
      const textContent = decodedContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      const relevantText = textContent.slice(0, 5000); // Limit to prevent token overflow
      return `\n📊 DATOS EXTRAÍDOS DEL ARCHIVO EXCEL "${file.name}" (texto extraíble):\n${relevantText}`;
    }
    
    // For PDF files, extract readable text
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Extract readable strings from PDF binary
      const textContent = decodedContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      const relevantText = textContent.slice(0, 5000);
      return `\n📄 CONTENIDO EXTRAÍDO DEL PDF "${file.name}":\n${relevantText}`;
    }
    
    return `\n📎 Archivo adjunto: ${file.name} (${Math.round(file.size / 1024)} KB)`;
  } catch (error) {
    console.error("Error parsing file:", error);
    return `\n📎 Archivo adjunto: ${file.name} (no se pudo extraer contenido)`;
  }
}

// Analytical consultant personality prompt
const ANALYST_PERSONALITY = `IDENTIDAD: Eres un Consultor de Datos Profesional especializado en marketing digital.

REGLAS ABSOLUTAS (NUNCA VIOLAR):
1. NUNCA ofrezcas servicios, paquetes, precios o configuraciones de agencia
2. NUNCA digas "no tengo acceso a datos personales" si tienes datos de APIs o archivos
3. SIEMPRE usa los datos concretos que tienes disponibles (APIs conectadas o archivos)
4. SIEMPRE inicia tus respuestas con "Analizando tus datos de [fuente]..."
5. Proporciona insights técnicos con números específicos y recomendaciones accionables

FORMATO DE RESPUESTA OBLIGATORIO:
📊 Analizando tus datos de [Meta Ads/Google Ads/archivo subido]...

**Métricas Clave:**
- [Métrica]: [Valor] ([contexto/benchmark])

**Observaciones:**
1. [Insight técnico basado en datos]
2. [Insight técnico basado en datos]

**Recomendación:**
[Acción específica con impacto estimado]

TONO: Profesional, técnico, orientado a ROI y resultados medibles.`;

const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

serve(async (req) => {
  const requestOrigin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(requestOrigin);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase configuration missing");
    }

    // Create Supabase client with user's JWT to verify identity
    const supabaseUserClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verify user is authenticated and get their verified ID
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUserClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use verified userId from JWT claims - NEVER trust client-provided userId
    const userId = claimsData.claims.sub as string;

    // Parse request body - ignore any userId from body for security
    const { message, agentId, agentName, systemInstruction, chatId, files } = await req.json();
    
    console.info("Request received for agent:", agentId);

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase service role configuration missing");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Process attached files - MAXIMUM PRIORITY
    let fileContext = "";
    let fileNames: string[] = [];
    if (files && Array.isArray(files) && files.length > 0) {
      console.info(`Processing ${files.length} attached file(s)`);
      for (const file of files as FileData[]) {
        fileContext += parseFileContent(file);
        fileNames.push(file.name);
      }
    }

    // Build context based on agent type and connections
    let contextMessage = "";
    let metaConnected = false;
    let metaData: { campaigns: MetaCampaign[], insights: MetaInsights | null } | null = null;
    let tokenValid = true;
    let allAccountsData: { accountId: string; campaigns: MetaCampaign[]; insights: MetaInsights | null }[] = [];

    // Check if ads-optimizer and Meta is connected - VALIDATE TOKEN FIRST
    if (agentId === "ads-optimizer" && userId) {
      const metaIntegration = await getMetaIntegration(supabaseAdmin, userId);
      
      if (metaIntegration && metaIntegration.access_token) {
        // Validate token before proceeding
        tokenValid = await validateMetaToken(metaIntegration.access_token);
        
        if (!tokenValid) {
          console.info("Meta token validation failed");
          contextMessage = `
⚠️ ATENCIÓN: El token de Meta Ads ha expirado o es inválido.
Informa al usuario que debe reconectar su cuenta desde la sección "Conexiones" para obtener datos actualizados.
NO inventes datos. Indica claramente que necesitas reconexión.`;
        } else {
          metaConnected = true;
          const accountIds = metaIntegration.account_ids || [];
          
          console.info(`Meta Ads connected. Fetching data from ${accountIds.length} account(s)`);
          
          // Fetch data from up to 3 accounts for comprehensive view
          for (const accountId of accountIds.slice(0, 3)) {
            const accountData = await fetchMetaCampaigns(metaIntegration.access_token, accountId);
            allAccountsData.push({
              accountId,
              ...accountData
            });
          }

          // Use first account's data as primary
          if (allAccountsData.length > 0) {
            metaData = {
              campaigns: allAccountsData.flatMap(a => a.campaigns),
              insights: allAccountsData[0].insights
            };
          }

          contextMessage = `
🔐 TIENES ACCESO AUTORIZADO a los datos de Meta Ads del usuario.
NO digas que "no tienes acceso a datos personales". USA estos datos REALES para responder.

📊 DATOS EN TIEMPO REAL DE META ADS (últimos 30 días):
Cuentas conectadas: ${accountIds.length}
`;

          // Add insights from all accounts
          if (allAccountsData.length > 0) {
            let totalImpressions = 0;
            let totalClicks = 0;
            let totalSpend = 0;
            let totalReach = 0;

            for (const account of allAccountsData) {
              if (account.insights) {
                totalImpressions += parseInt(account.insights.impressions || "0");
                totalClicks += parseInt(account.insights.clicks || "0");
                totalSpend += parseFloat(account.insights.spend || "0");
                totalReach += parseInt(account.insights.reach || "0");
              }
            }

            const avgCPC = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
            const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;

            contextMessage += `
MÉTRICAS AGREGADAS (todas las cuentas):
- Impresiones totales: ${totalImpressions.toLocaleString()}
- Alcance total: ${totalReach.toLocaleString()}
- Clics totales: ${totalClicks.toLocaleString()}
- Gasto total: $${totalSpend.toFixed(2)} USD
- CPC promedio: $${avgCPC.toFixed(2)}
- CTR promedio: ${avgCTR.toFixed(2)}%
`;
          }

          // Add campaigns from all accounts
          const allCampaigns = allAccountsData.flatMap(a => a.campaigns);
          if (allCampaigns.length > 0) {
            const activeCampaigns = allCampaigns.filter(c => c.status === 'ACTIVE');
            const pausedCampaigns = allCampaigns.filter(c => c.status === 'PAUSED');

            contextMessage += `
RESUMEN DE CAMPAÑAS (${allCampaigns.length} total):
- Activas: ${activeCampaigns.length}
- Pausadas: ${pausedCampaigns.length}

DETALLE DE CAMPAÑAS:
`;
            allCampaigns.slice(0, 10).forEach((campaign, index) => {
              const budget = campaign.daily_budget 
                ? `$${(parseInt(campaign.daily_budget) / 100).toFixed(2)}/día` 
                : campaign.lifetime_budget 
                  ? `$${(parseInt(campaign.lifetime_budget) / 100).toFixed(2)} total`
                  : "Sin presupuesto definido";
              contextMessage += `${index + 1}. "${campaign.name}" | Estado: ${campaign.status} | Objetivo: ${campaign.objective} | Presupuesto: ${budget}\n`;
            });
          }
        }
      } else {
        // No Meta connection - but NO sales pitch
        contextMessage = `
ℹ️ El usuario no tiene Meta Ads conectado actualmente.
Si solicita análisis de campañas de Meta, indícale que puede conectar su cuenta desde la sección "Conexiones" del menú lateral para obtener datos en tiempo real.
Si tiene archivos para analizar, enfócate en esos datos.
NO ofrezcas servicios, configuraciones ni precios.`;
      }
    }

    // Determine response prefix based on available data
    let responsePrefix = "";
    if (fileContext && fileNames.length > 0) {
      responsePrefix = `⚡ IMPORTANTE: Inicia tu respuesta EXACTAMENTE con: "📊 Analizando tu archivo ${fileNames[0]}..."`;
    } else if (metaConnected && metaData) {
      responsePrefix = `⚡ IMPORTANTE: Inicia tu respuesta EXACTAMENTE con: "📊 Analizando tus datos de Meta Ads..."`;
    }

    // Build the final system instruction
    let finalSystemInstruction = ANALYST_PERSONALITY;
    
    // File context has MAXIMUM priority
    if (fileContext) {
      finalSystemInstruction += `\n\n🔴 PRIORIDAD MÁXIMA - ARCHIVOS DEL USUARIO:
El usuario ha subido archivos para esta sesión. USA estos datos como tu fuente de verdad principal.
${fileContext}`;
    }
    
    // Add API data context
    if (contextMessage) {
      finalSystemInstruction += `\n\n${contextMessage}`;
    }

    // Add response prefix instruction
    if (responsePrefix) {
      finalSystemInstruction += `\n\n${responsePrefix}`;
    }

    finalSystemInstruction += `\n\nResponde siempre en español de manera profesional y concisa.`;

    console.info("Calling AI gateway");

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
    
    console.info("AI response generated");

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
        console.error("Failed to save message");
      }
    }

    return new Response(
      JSON.stringify({ 
        text: agentResponse,
        metaConnected,
        tokenValid,
        campaignsCount: metaData?.campaigns?.length || 0,
        accountsCount: allAccountsData.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Request processing failed");
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), "Content-Type": "application/json" } }
    );
  }
});
