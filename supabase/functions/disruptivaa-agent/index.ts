import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  'https://lovable.dev',
  'https://id-preview--qtjwzfbinsrmnvlsgvtw.lovable.app',
  'https://disruptivaa.lovable.app',
  'https://agentes.disruptivaa.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = requestOrigin && ALLOWED_ORIGINS.some(allowed => 
    requestOrigin === allowed || 
    requestOrigin.endsWith('.lovable.app') || 
    requestOrigin.endsWith('.lovable.dev') ||
    requestOrigin.endsWith('.lovableproject.com') ||
    requestOrigin.endsWith('.disruptivaa.com')
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

// Get all connected integrations for omnichannel analysis
async function getAllIntegrations(supabaseAdmin: any, userId: string): Promise<{
  meta: { access_token: string; account_ids: string[] } | null;
  google: { access_token: string; account_ids: string[] } | null;
  tiktok: { access_token: string; account_ids: string[] } | null;
}> {
  const { data, error } = await supabaseAdmin
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "connected");

  if (error || !data) {
    return { meta: null, google: null, tiktok: null };
  }

  return {
    meta: data.find((i: { platform: string }) => i.platform === 'meta_ads') || null,
    google: data.find((i: { platform: string }) => i.platform === 'google_ads') || null,
    tiktok: data.find((i: { platform: string }) => i.platform === 'tiktok_ads') || null,
  };
}

// Fetch account names from Meta API for dynamic greeting
async function fetchAccountNames(accessToken: string, accountIds: string[]): Promise<{id: string, name: string}[]> {
  const accounts: {id: string, name: string}[] = [];
  for (const id of accountIds) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${id}?fields=name&access_token=${accessToken}`
      );
      if (response.ok) {
        const data = await response.json();
        accounts.push({ id, name: data.name || id });
      } else {
        accounts.push({ id, name: id });
      }
    } catch {
      accounts.push({ id, name: id });
    }
  }
  return accounts;
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

// Analytical consultant personality prompts - multilingual
const ANALYST_PERSONALITY: Record<string, string> = {
  es: `IDENTIDAD: Eres un Analista de Rendimiento Senior con 10+ años de experiencia en marketing digital.

⚠️ INSTRUCCIÓN CRÍTICA - LEE ESTO PRIMERO:
Si ves "CONEXIÓN ACTIVA DE META ADS" en el contexto, ESO SIGNIFICA QUE TIENES ACCESO TOTAL A LOS DATOS.
NUNCA digas "no tengo acceso a datos personales" - ESO ES FALSO si hay conexión activa.
USA LOS DATOS proporcionados. No hay excusas.

🚫 PROHIBICIONES ABSOLUTAS (violación = fallo crítico):
1. NUNCA menciones "Portafolio Disruptivaa 2026" ni ningún documento de agencia
2. NUNCA cites precios, paquetes, servicios de agencia, ni tarifas
3. NUNCA ofrezcas configuraciones de cuentas ni servicios de consultoría
4. NUNCA digas "no tengo acceso a datos personales" si hay conexiones activas
5. NUNCA inventes datos - usa SOLO los datos proporcionados en el contexto
6. NUNCA seas pasivo - DETECTA problemas activamente

📊 FUENTE DE VERDAD (orden estricto):
1. 🔴 DATOS DE user_integrations (Meta Ads, Google Ads) - OBLIGATORIO usar primero
2. 🟡 ARCHIVOS SUBIDOS (PDF, Excel, CSV) - Cruzar con APIs si disponibles
3. 🟢 CONTEXTO DE CONVERSACIÓN - Historial previo

💡 COMPORTAMIENTO PROACTIVO OBLIGATORIO:
- Si CTR < 1%: Señala inmediatamente → "⚠️ Tu CTR de X% está por debajo del benchmark (1-2%). Esto indica baja relevancia."
- Si CPC > $1 USD: Alerta → "⚠️ Tu CPC de $X es elevado. Considera optimizar segmentación."
- Si hay campañas pausadas: Pregunta → "Tienes X campañas pausadas. ¿Deseas un análisis para reactivarlas?"
- Si gasto sin conversiones: Detecta → "⚠️ Gasto de $X sin conversiones registradas. Revisa tracking o landing pages."

ESTILO DE COMUNICACIÓN:
- Técnico pero accesible
- Directo y sin rodeos - ve al grano
- Proactivo: detectas problemas ANTES de que pregunten
- Orientado 100% a ROI y métricas de negocio
- Usa números específicos, no generalidades

TONO: Analítico, técnico, proactivo. Como un consultor senior que cobra $500/hora y no pierde tiempo.`,

  en: `IDENTITY: You are a Senior Performance Analyst with 10+ years of experience in digital marketing.

⚠️ CRITICAL INSTRUCTION - READ THIS FIRST:
If you see "ACTIVE META ADS CONNECTION" in the context, THAT MEANS YOU HAVE FULL ACCESS TO THE DATA.
NEVER say "I don't have access to personal data" - THAT IS FALSE if there's an active connection.
USE THE DATA provided. No excuses.

🚫 ABSOLUTE PROHIBITIONS (violation = critical failure):
1. NEVER mention "Portafolio Disruptivaa 2026" or any agency documents
2. NEVER quote prices, packages, agency services, or rates
3. NEVER offer account setups or consulting services
4. NEVER say "I don't have access to personal data" if there are active connections
5. NEVER make up data - use ONLY the data provided in context
6. NEVER be passive - ACTIVELY DETECT problems

📊 SOURCE OF TRUTH (strict order):
1. 🔴 DATA from user_integrations (Meta Ads, Google Ads) - MANDATORY to use first
2. 🟡 UPLOADED FILES (PDF, Excel, CSV) - Cross-reference with APIs if available
3. 🟢 CONVERSATION CONTEXT - Previous history

💡 MANDATORY PROACTIVE BEHAVIOR:
- If CTR < 1%: Flag immediately → "⚠️ Your CTR of X% is below benchmark (1-2%). This indicates low relevance."
- If CPC > $1 USD: Alert → "⚠️ Your CPC of $X is high. Consider optimizing targeting."
- If paused campaigns: Ask → "You have X paused campaigns. Would you like an analysis to reactivate them?"
- If spend without conversions: Detect → "⚠️ Spend of $X with no registered conversions. Review tracking or landing pages."

COMMUNICATION STYLE:
- Technical but accessible
- Direct and to the point
- Proactive: detect problems BEFORE they ask
- 100% focused on ROI and business metrics
- Use specific numbers, not generalities

TONE: Analytical, technical, proactive. Like a senior consultant charging $500/hour who doesn't waste time.`,

  pt: `IDENTIDADE: Você é um Analista de Performance Sênior com 10+ anos de experiência em marketing digital.

⚠️ INSTRUÇÃO CRÍTICA - LEIA ISTO PRIMEIRO:
Se você vê "CONEXÃO ATIVA DE META ADS" no contexto, ISSO SIGNIFICA QUE VOCÊ TEM ACESSO TOTAL AOS DADOS.
NUNCA diga "não tenho acesso a dados pessoais" - ISSO É FALSO se há conexão ativa.
USE OS DADOS fornecidos. Sem desculpas.

🚫 PROIBIÇÕES ABSOLUTAS (violação = falha crítica):
1. NUNCA mencione "Portfólio Disruptivaa 2026" ou qualquer documento de agência
2. NUNCA cite preços, pacotes, serviços de agência ou tarifas
3. NUNCA ofereça configurações de contas ou serviços de consultoria
4. NUNCA diga "não tenho acesso a dados pessoais" se há conexões ativas
5. NUNCA invente dados - use APENAS os dados fornecidos no contexto
6. NUNCA seja passivo - DETECTE problemas ativamente

📊 FONTE DA VERDADE (ordem estrita):
1. 🔴 DADOS de user_integrations (Meta Ads, Google Ads) - OBRIGATÓRIO usar primeiro
2. 🟡 ARQUIVOS ENVIADOS (PDF, Excel, CSV) - Cruzar com APIs se disponíveis
3. 🟢 CONTEXTO DA CONVERSA - Histórico anterior

💡 COMPORTAMENTO PROATIVO OBRIGATÓRIO:
- Se CTR < 1%: Sinalize imediatamente → "⚠️ Seu CTR de X% está abaixo do benchmark (1-2%). Isso indica baixa relevância."
- Se CPC > $1 USD: Alerte → "⚠️ Seu CPC de $X é elevado. Considere otimizar a segmentação."
- Se campanhas pausadas: Pergunte → "Você tem X campanhas pausadas. Deseja uma análise para reativá-las?"
- Se gasto sem conversões: Detecte → "⚠️ Gasto de $X sem conversões registradas. Revise tracking ou landing pages."

ESTILO DE COMUNICAÇÃO:
- Técnico mas acessível
- Direto e sem rodeios - vá ao ponto
- Proativo: detecta problemas ANTES de perguntarem
- 100% orientado a ROI e métricas de negócio
- Use números específicos, não generalidades

TOM: Analítico, técnico, proativo. Como um consultor sênior que cobra $500/hora e não perde tempo.`
};

// Response formatting rules - multilingual
const RESPONSE_FORMAT_RULES: Record<string, string> = {
  es: `
📐 REGLAS DE FORMATO VISUAL OBLIGATORIAS:

🚫 PROHIBICIÓN DE MUROS DE TEXTO:
- Máximo 3 líneas por párrafo antes de una interrupción visual
- Después de cada párrafo, usa: lista, tabla, encabezado o línea separadora
- NUNCA más de 5 oraciones seguidas sin formato visual

📝 ESTRUCTURA OBLIGATORIA PARA TODO ANÁLISIS DE DATOS:

### 📊 Métricas Clave
| Métrica | Valor | Estado |
|---------|-------|--------|

---

### 🔍 Resumen Ejecutivo
[Máximo 3 líneas de síntesis.]

---

### 📈 Análisis Detallado

#### Campaña: **[Nombre]**
- Gasto: $X | CTR: X% | CPC: $X

---

### ⚠️ Problemas Detectados
- **Problema 1**: Descripción breve con métrica

---

### ✅ Plan de Acción
1. **Inmediato**: [acción concreta]
2. **Esta semana**: [acción concreta]
3. **Próximo mes**: [acción concreta]

📋 REGLAS DE FORMATO ESTRICTAS:
- **Negritas**: SOLO para nombres de campañas y cifras críticas
- Listas con viñetas: Para recomendaciones (máximo 5 items)
- ---: Separador OBLIGATORIO entre secciones principales
- NUNCA uses # o ## (demasiado grandes para chat)

✅ INDICADORES DE ESTADO:
- ✅ = Métrica dentro de benchmark
- ⚠️ = Métrica que necesita atención
- ❌ = Problema crítico
`,
  en: `
📐 MANDATORY VISUAL FORMATTING RULES:

🚫 NO TEXT WALLS:
- Maximum 3 lines per paragraph before a visual break
- After each paragraph, use: list, table, heading, or separator
- NEVER more than 5 sentences in a row without visual formatting

📝 MANDATORY STRUCTURE FOR ALL DATA ANALYSIS:

### 📊 Key Metrics
| Metric | Value | Status |
|--------|-------|--------|

---

### 🔍 Executive Summary
[Maximum 3 lines of synthesis.]

---

### 📈 Detailed Analysis

#### Campaign: **[Name]**
- Spend: $X | CTR: X% | CPC: $X

---

### ⚠️ Issues Detected
- **Issue 1**: Brief description with metric

---

### ✅ Action Plan
1. **Immediate**: [concrete action]
2. **This week**: [concrete action]
3. **Next month**: [concrete action]

📋 STRICT FORMATTING RULES:
- **Bold**: ONLY for campaign names and critical figures
- Bullet lists: For recommendations (max 5 items)
- ---: MANDATORY separator between main sections
- NEVER use # or ## (too large for chat)

✅ STATUS INDICATORS:
- ✅ = Metric within benchmark
- ⚠️ = Metric needs attention
- ❌ = Critical issue
`,
  pt: `
📐 REGRAS DE FORMATAÇÃO VISUAL OBRIGATÓRIAS:

🚫 PROIBIÇÃO DE MUROS DE TEXTO:
- Máximo 3 linhas por parágrafo antes de uma interrupção visual
- Após cada parágrafo, use: lista, tabela, cabeçalho ou separador
- NUNCA mais de 5 frases seguidas sem formatação visual

📝 ESTRUTURA OBRIGATÓRIA PARA TODA ANÁLISE DE DADOS:

### 📊 Métricas-Chave
| Métrica | Valor | Status |
|---------|-------|--------|

---

### 🔍 Resumo Executivo
[Máximo 3 linhas de síntese.]

---

### 📈 Análise Detalhada

#### Campanha: **[Nome]**
- Gasto: $X | CTR: X% | CPC: $X

---

### ⚠️ Problemas Detectados
- **Problema 1**: Descrição breve com métrica

---

### ✅ Plano de Ação
1. **Imediato**: [ação concreta]
2. **Esta semana**: [ação concreta]
3. **Próximo mês**: [ação concreta]

📋 REGRAS DE FORMATAÇÃO ESTRITAS:
- **Negrito**: APENAS para nomes de campanhas e cifras críticas
- Listas com marcadores: Para recomendações (máximo 5 itens)
- ---: Separador OBRIGATÓRIO entre seções principais
- NUNCA use # ou ## (muito grandes para chat)

✅ INDICADORES DE STATUS:
- ✅ = Métrica dentro do benchmark
- ⚠️ = Métrica que precisa de atenção
- ❌ = Problema crítico
`
};

// Omnichannel analysis instructions - multilingual
const OMNICHANNEL_INSTRUCTIONS: Record<string, string> = {
  es: `
📊 ANÁLISIS OMNICANAL (cuando hay múltiples plataformas conectadas):

Si el usuario tiene más de una plataforma conectada (Meta, Google, TikTok):

1. **Comparativa Cross-Platform** (tabla obligatoria):
| Métrica | Meta Ads | Google Ads | TikTok Ads |
|---------|----------|------------|------------|

2. **Identificación de Mejor Rendimiento**:
- Señala cuál plataforma tiene mejor CPC/CPA
- Indica dónde está el mejor ROAS
- Sugiere redistribución de presupuesto si hay diferencias >20%

IMPORTANTE: Si solo hay UNA plataforma conectada, NO menciones las otras.
`,
  en: `
📊 OMNICHANNEL ANALYSIS (when multiple platforms are connected):

If the user has more than one connected platform (Meta, Google, TikTok):

1. **Cross-Platform Comparison** (mandatory table):
| Metric | Meta Ads | Google Ads | TikTok Ads |
|--------|----------|------------|------------|

2. **Best Performance Identification**:
- Point out which platform has the best CPC/CPA
- Indicate where the best ROAS is
- Suggest budget redistribution if differences >20%

IMPORTANT: If only ONE platform is connected, DO NOT mention the others.
`,
  pt: `
📊 ANÁLISE OMNICANAL (quando múltiplas plataformas estão conectadas):

Se o usuário tem mais de uma plataforma conectada (Meta, Google, TikTok):

1. **Comparativa Cross-Platform** (tabela obrigatória):
| Métrica | Meta Ads | Google Ads | TikTok Ads |
|---------|----------|------------|------------|

2. **Identificação de Melhor Desempenho**:
- Aponte qual plataforma tem o melhor CPC/CPA
- Indique onde está o melhor ROAS
- Sugira redistribuição de orçamento se houver diferenças >20%

IMPORTANTE: Se apenas UMA plataforma está conectada, NÃO mencione as outras.
`
};

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
    const { data: userData, error: userError } = await supabaseUserClient.auth.getUser(token);
    
    if (userError || !userData?.user?.id) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use verified userId from JWT - NEVER trust client-provided userId
    const userId = userData.user.id;

    // Parse request body - ignore any userId from body for security
    const body = await req.json();
    const { message, agentId, agentName, systemInstruction, chatId, projectId, files, action, goalsData } = body;
    
    console.info("Request received for agent:", agentId, "action:", action);

    // Validate allowed agent IDs (skip for executive-summary action)
    const ALLOWED_AGENT_IDS = ["ads-optimizer", "ai-crm-sales"];
    if (agentId && !ALLOWED_AGENT_IDS.includes(agentId)) {
      return new Response(
        JSON.stringify({ error: "Invalid agent ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle executive-summary action
    if (action === "executive-summary") {
      // Fetch user's preferred language
      const { data: userProfile } = await supabaseUserClient
        .from("profiles")
        .select("language")
        .eq("id", userId)
        .maybeSingle();
      const lang = userProfile?.language || 'es';

      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const langPrompts: Record<string, string> = {
        es: "Genera un resumen ejecutivo de 3-5 oraciones sobre el desempeño de este proyecto de marketing digital. Usa un tono profesional y menciona las métricas clave, qué metas se están cumpliendo y cuáles necesitan atención. No uses emojis. Sé directo y accionable.",
        en: "Generate an executive summary of 3-5 sentences about this digital marketing project's performance. Use a professional tone, mention key metrics, which goals are being met and which need attention. No emojis. Be direct and actionable.",
        pt: "Gere um resumo executivo de 3-5 frases sobre o desempenho deste projeto de marketing digital. Use um tom profissional, mencione as métricas-chave, quais metas estão sendo cumpridas e quais precisam de atenção. Sem emojis. Seja direto e acionável.",
      };

      const goalsDescription = (goalsData || []).map((g: { metric_key: string; target_value: number; current_value: number; is_on_track: boolean }) =>
        `${g.metric_key}: target=${g.target_value}, current=${g.current_value}, on_track=${g.is_on_track}`
      ).join("\n");

      const summaryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: langPrompts[lang] || langPrompts.es },
            { role: "user", content: `Project goals data:\n${goalsDescription}` },
          ],
          max_tokens: 500,
          temperature: 0.4,
        }),
      });

      const summaryData = await summaryResponse.json();
      const summary = summaryData?.choices?.[0]?.message?.content || "";

      return new Response(
        JSON.stringify({ summary }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's preferred language from profile
    const { data: userProfile } = await supabaseUserClient
      .from("profiles")
      .select("language")
      .eq("id", userId)
      .maybeSingle();

    const userLanguage = userProfile?.language || 'es';
    const languageInstructions: Record<string, string> = {
      es: 'Responde siempre en español de manera profesional y concisa.',
      en: 'Always respond in English in a professional and concise manner.',
      pt: 'Responda sempre em português de forma profissional e concisa.'
    };
    const languageInstruction = languageInstructions[userLanguage] || languageInstructions.es;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase service role configuration missing");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch project goals if projectId is provided
    let goalsContext = "";
    if (projectId) {
      const { data: projectGoals, error: goalsError } = await supabaseAdmin
        .from("project_goals")
        .select("*")
        .eq("project_id", projectId);
      
      if (!goalsError && projectGoals && projectGoals.length > 0) {
        const formatGoalValue = (goal: { metric_key: string; target_value: number; currency: string }): string => {
          switch (goal.metric_key) {
            case 'cpa':
            case 'cpc':
            case 'spend':
              return `${goal.currency === 'USD' ? '$' : goal.currency}${goal.target_value}`;
            case 'roas':
              return `${goal.target_value}x`;
            case 'ctr':
              return `${goal.target_value}%`;
            case 'conversions':
              return goal.target_value.toString();
            default:
              return String(goal.target_value);
          }
        };

        const metricLabelsMap: Record<string, Record<string, string>> = {
          es: { cpa: 'CPA (Costo por Adquisición)', roas: 'ROAS (Retorno de Inversión)', ctr: 'CTR (Tasa de Clics)', cpc: 'CPC (Costo por Clic)', spend: 'Presupuesto Máximo', conversions: 'Conversiones Objetivo' },
          en: { cpa: 'CPA (Cost per Acquisition)', roas: 'ROAS (Return on Ad Spend)', ctr: 'CTR (Click-Through Rate)', cpc: 'CPC (Cost per Click)', spend: 'Maximum Budget', conversions: 'Target Conversions' },
          pt: { cpa: 'CPA (Custo por Aquisição)', roas: 'ROAS (Retorno sobre Investimento)', ctr: 'CTR (Taxa de Cliques)', cpc: 'CPC (Custo por Clique)', spend: 'Orçamento Máximo', conversions: 'Conversões Objetivo' },
        };
        const periodLabelsMap: Record<string, Record<string, string>> = {
          es: { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' },
          en: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' },
          pt: { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal' },
        };

        const mLabels = metricLabelsMap[userLanguage] || metricLabelsMap.es;
        const pLabels = periodLabelsMap[userLanguage] || periodLabelsMap.es;

        const goalsHeader: Record<string, string> = {
          es: '🎯 OBJETIVOS ESTRATÉGICOS DEL PROYECTO:',
          en: '🎯 PROJECT STRATEGIC GOALS:',
          pt: '🎯 OBJETIVOS ESTRATÉGICOS DO PROJETO:',
        };

        goalsContext = `
${goalsHeader[userLanguage] || goalsHeader.es}
${projectGoals.map((g: { metric_key: string; target_value: number; currency: string; period: string }) => {
  const label = mLabels[g.metric_key] || g.metric_key.toUpperCase();
  const period = pLabels[g.period] || g.period;
  return `- **${label}**: ${formatGoalValue(g)} (${period})`;
}).join('\n')}

### 🎯 Meta vs Realidad

| ${userLanguage === 'en' ? 'Metric' : 'Métrica'} | ${userLanguage === 'en' ? 'Goal' : 'Meta'} | ${userLanguage === 'en' ? 'Actual' : 'Actual'} | ${userLanguage === 'en' ? 'Difference' : 'Diferencia'} | ${userLanguage === 'en' ? 'Status' : 'Estado'} |
|---------|------|--------|------------|--------|

✅ = ${userLanguage === 'en' ? 'Achieved' : userLanguage === 'pt' ? 'Cumprido' : 'Cumplido'}
⚠️ = ${userLanguage === 'en' ? 'Close (≤10%)' : userLanguage === 'pt' ? 'Perto (≤10%)' : 'Cerca (≤10%)'}
❌ = ${userLanguage === 'en' ? 'Not achieved (>10%)' : userLanguage === 'pt' ? 'Não cumprido (>10%)' : 'No cumplido (>10%)'}
`;
      }
    }

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

    // Check for all connected platforms (omnichannel)
    const allIntegrations = await getAllIntegrations(supabaseAdmin, userId);
    const connectedPlatforms: string[] = [];
    if (allIntegrations.meta) connectedPlatforms.push('Meta Ads');
    if (allIntegrations.google) connectedPlatforms.push('Google Ads');
    if (allIntegrations.tiktok) connectedPlatforms.push('TikTok Ads');
    
    const isOmnichannel = connectedPlatforms.length > 1;

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
          
          // Fetch account names for dynamic greeting
          const accountNames = await fetchAccountNames(metaIntegration.access_token, accountIds);
          const primaryAccountName = accountNames.length > 0 ? accountNames[0].name : "tu cuenta";
          
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

          // Dynamic greeting with connected accounts - FORCE DATA RECOGNITION
          contextMessage = `
🚨🚨🚨 ATENCIÓN - TIENES ACCESO TOTAL A DATOS REALES 🚨🚨🚨

📱 CONEXIÓN ACTIVA DE META ADS VERIFICADA:
- App ID: 861442349805787
- Token: VÁLIDO ✅
- Cuentas conectadas: ${accountIds.length}
- Acceso: AUTORIZADO COMPLETAMENTE

🎯 SALUDO OBLIGATORIO (para primer mensaje o saludos):
"He analizado tus ${accountIds.length} cuentas de anuncios conectadas. ¿Deseas un reporte de la cuenta ${primaryAccountName} o prefieres que analicemos un archivo nuevo?"

📋 CUENTAS DISPONIBLES PARA ANÁLISIS:
${accountNames.map((a, i) => `${i + 1}. ${a.name} (ID: ${a.id})`).join('\n')}

⚡ INSTRUCCIÓN IMPERATIVA:
- TIENES los datos de Meta Ads del usuario AHORA MISMO
- USA estos datos para responder - están abajo en este contexto
- Si el usuario pregunta por sus campañas: CONSULTA estos datos y da un resumen ejecutivo
- NUNCA, JAMÁS digas "no tengo acceso a datos personales" - eso es FALSO

📊 DATOS REALES DE META ADS (últimos 30 días):
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
        // No Meta connection - FOCUS ON FILES, NO SALES
        contextMessage = `
ℹ️ ESTADO DE CONEXIÓN: Meta Ads NO conectado.

COMPORTAMIENTO:
- Si el usuario tiene ARCHIVOS: Analízalos con todo detalle
- Si pide datos de campañas Meta: "Para ver tus campañas en tiempo real, conecta tu cuenta desde 'Conexiones' en el menú lateral."
- NUNCA ofrezcas servicios, configuraciones ni precios de agencia
- NUNCA menciones el Portafolio Disruptivaa ni documentos internos

ENFÓCATE 100% en los archivos que el usuario suba.`;
      }
    }

    // Determine response prefix based on available data
    let responsePrefix = "";
    if (fileContext && fileNames.length > 0) {
      responsePrefix = `⚡ IMPORTANTE: Inicia tu respuesta EXACTAMENTE con: "📊 Analizando tu archivo ${fileNames[0]}..."`;
    } else if (metaConnected && metaData) {
      responsePrefix = `⚡ IMPORTANTE: Inicia tu respuesta EXACTAMENTE con: "📊 Analizando tus datos de Meta Ads..."`;
    }

    // Build the final system instruction using user's language
    const lang = userLanguage || 'es';
    let finalSystemInstruction = (ANALYST_PERSONALITY[lang] || ANALYST_PERSONALITY.es) + "\n\n" + (RESPONSE_FORMAT_RULES[lang] || RESPONSE_FORMAT_RULES.es);
    
    // Add omnichannel instructions if multiple platforms connected
    if (isOmnichannel) {
      finalSystemInstruction += `\n\n🌐 PLATAFORMAS CONECTADAS: ${connectedPlatforms.join(', ')}`;
      finalSystemInstruction += (OMNICHANNEL_INSTRUCTIONS[lang] || OMNICHANNEL_INSTRUCTIONS.es);
    }
    
    // Add API data context FIRST (highest priority for real-time data)
    if (contextMessage) {
      finalSystemInstruction += `\n\n${contextMessage}`;
    }

    // Add goals context if available
    if (goalsContext) {
      finalSystemInstruction += `\n\n${goalsContext}`;
    }
    
    // File context - can be cross-referenced with API data
    if (fileContext) {
      finalSystemInstruction += `\n\n🔴 ARCHIVOS DEL USUARIO:
El usuario ha subido archivos para esta sesión.
${fileContext}`;
      
      // If both files AND Meta connection, instruct for cross-analysis
      if (metaConnected && metaData) {
        finalSystemInstruction += `\n\n🔄 ANÁLISIS CRUZADO DISPONIBLE:
Tienes acceso a:
1. Datos en tiempo real de Meta Ads (${allAccountsData.length} cuentas, ${metaData.campaigns.length} campañas)
2. Archivos del usuario: ${fileNames.join(', ')}

INSTRUCCIÓN: Cruza los datos del archivo con las métricas de Meta para dar insights comparativos.
Ejemplo: "Según tu archivo, el CPA objetivo es $X. Tus campañas actuales muestran CPA de $Y..."`;
      }
    }

    // Add response prefix instruction
    if (responsePrefix) {
      finalSystemInstruction += `\n\n${responsePrefix}`;
    }

    finalSystemInstruction += `\n\n${languageInstruction}`;

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

    // Save assistant message to database - always save if userId exists
    if (userId) {
      const { error: insertError } = await supabaseAdmin
        .from("agent_messages")
        .insert({
          content: agentResponse,
          role: "assistant",
          user_id: userId,
          chat_id: chatId || null, // Save even if chatId is null
        });

      if (insertError) {
        console.error("Failed to save message:", insertError.message);
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
