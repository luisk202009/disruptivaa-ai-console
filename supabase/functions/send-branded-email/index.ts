import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const emailTranslations: Record<string, Record<string, { heading: string; body: string; cta: string; footer: string }>> = {
  es: {
    welcome: {
      heading: "¡Bienvenido a Disruptivaa!",
      body: "Tu cuenta ha sido creada exitosamente. Estás a un paso de transformar tu estrategia digital con inteligencia artificial.",
      cta: "Ir al Dashboard",
      footer: "Si tienes preguntas, contáctanos en soporte@disruptivaa.com",
    },
    payment_success: {
      heading: "¡Pago Exitoso!",
      body: "Tu pago ha sido confirmado y tu suscripción está activa. Ya tienes acceso completo a todas las herramientas de la plataforma.",
      cta: "Ver mi cuenta",
      footer: "Gracias por confiar en Disruptivaa. Si necesitas ayuda, estamos aquí para ti.",
    },
    support: {
      heading: "Soporte Disruptivaa",
      body: "Hemos recibido tu solicitud y nuestro equipo está trabajando en ella. Te responderemos lo antes posible.",
      cta: "Contactar Soporte",
      footer: "Nuestro equipo de soporte está disponible de lunes a viernes, 9:00 - 18:00 (GMT-5).",
    },
  },
  en: {
    welcome: {
      heading: "Welcome to Disruptivaa!",
      body: "Your account has been created successfully. You're one step away from transforming your digital strategy with artificial intelligence.",
      cta: "Go to Dashboard",
      footer: "If you have questions, contact us at support@disruptivaa.com",
    },
    payment_success: {
      heading: "Payment Successful!",
      body: "Your payment has been confirmed and your subscription is now active. You have full access to all platform tools.",
      cta: "View my account",
      footer: "Thank you for trusting Disruptivaa. If you need help, we're here for you.",
    },
    support: {
      heading: "Disruptivaa Support",
      body: "We've received your request and our team is working on it. We'll get back to you as soon as possible.",
      cta: "Contact Support",
      footer: "Our support team is available Monday to Friday, 9:00 AM - 6:00 PM (GMT-5).",
    },
  },
  pt: {
    welcome: {
      heading: "Bem-vindo ao Disruptivaa!",
      body: "Sua conta foi criada com sucesso. Você está a um passo de transformar sua estratégia digital com inteligência artificial.",
      cta: "Ir ao Painel",
      footer: "Se tiver dúvidas, entre em contato conosco em suporte@disruptivaa.com",
    },
    payment_success: {
      heading: "Pagamento Confirmado!",
      body: "Seu pagamento foi confirmado e sua assinatura está ativa. Você tem acesso completo a todas as ferramentas da plataforma.",
      cta: "Ver minha conta",
      footer: "Obrigado por confiar na Disruptivaa. Se precisar de ajuda, estamos aqui para você.",
    },
    support: {
      heading: "Suporte Disruptivaa",
      body: "Recebemos sua solicitação e nossa equipe está trabalhando nela. Retornaremos o mais breve possível.",
      cta: "Contatar Suporte",
      footer: "Nossa equipe de suporte está disponível de segunda a sexta, 9:00 - 18:00 (GMT-5).",
    },
  },
};

function buildEmailHtml(
  templateName: string,
  variables: {
    clientName: string;
    logoUrl?: string;
    brandColor: string;
    lang: string;
  }
): string {
  const lang = variables.lang && emailTranslations[variables.lang] ? variables.lang : "es";
  const t = emailTranslations[lang][templateName] || emailTranslations["es"]["welcome"];
  const brandColor = variables.brandColor || "#00A3FF";
  const clientName = variables.clientName || "Cliente";
  const logoUrl = variables.logoUrl;

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="max-width:180px;max-height:60px;margin:0 auto 24px;display:block;" />`
    : `<div style="font-size:28px;font-weight:700;letter-spacing:2px;color:${brandColor};text-align:center;margin-bottom:24px;">DISRUPTIVAA</div>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${t.heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Fira Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#111111;border-radius:16px;overflow:hidden;border:1px solid #222222;">
<!-- Header -->
<tr><td style="padding:40px 40px 24px;text-align:center;border-bottom:1px solid #222222;">
  ${logoSection}
</td></tr>
<!-- Body -->
<tr><td style="padding:40px;">
  <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#FFFFFF;text-align:center;">${t.heading}</h1>
  <p style="margin:0 0 24px;font-size:15px;color:#9CA3AF;text-align:center;">
    ${lang === "es" ? "Hola" : lang === "pt" ? "Olá" : "Hello"}, <strong style="color:#FFFFFF;">${clientName}</strong>
  </p>
  <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#D1D5DB;text-align:center;">${t.body}</p>
  <!-- CTA Button -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://disruptivaa.lovable.app" target="_blank" style="display:inline-block;padding:14px 36px;background-color:${brandColor};color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">
      ${t.cta}
    </a>
  </td></tr>
  </table>
</td></tr>
<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid #222222;text-align:center;">
  <p style="margin:0 0 8px;font-size:12px;color:#6B7280;">${t.footer}</p>
  <p style="margin:0;font-size:11px;color:#4B5563;">© ${new Date().getFullYear()} Disruptivaa. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      await supabase.from("ai_agent_logs").insert({
        action_taken: "email_send_error",
        result_status: "RESEND_API_KEY not configured",
      });
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, templateName, variables } = await req.json();

    if (!to || !subject || !templateName) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, templateName" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildEmailHtml(templateName, variables || {
      clientName: "Cliente",
      brandColor: "#00A3FF",
      lang: "es",
    });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Disruptivaa <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      await supabase.from("ai_agent_logs").insert({
        action_taken: "email_send_error",
        result_status: `Resend error: ${resendResponse.status} - ${JSON.stringify(resendData)}`,
      });
      return new Response(JSON.stringify({ error: "Failed to send email", details: resendData }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent successfully to ${to}:`, resendData);
    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-branded-email error:", err);
    try {
      await supabase.from("ai_agent_logs").insert({
        action_taken: "email_send_error",
        result_status: `Exception: ${(err as Error).message}`,
      });
    } catch (_) { /* ignore log errors */ }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
