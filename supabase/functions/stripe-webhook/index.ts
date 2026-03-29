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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Credentials': 'true',
  };
}

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const sig = parts.find((p) => p.startsWith("v1="))?.split("=")[1];
  if (!timestamp || !sig) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === sig;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Server configuration error", { status: 500, headers: corsHeaders });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400, headers: corsHeaders });
    }

    const body = await req.text();
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid Stripe signature");
      return new Response("Invalid signature", { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(body);
    console.log(`Stripe event received: ${event.type}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const companyId = session.client_reference_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!companyId) {
          console.error("No client_reference_id in checkout session");
          break;
        }

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("company_id", companyId)
          .eq("status", "pending");

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        } else {
          console.log(`Subscription activated for company ${companyId}`);
        }

        await supabase.from("notifications").insert({
          company_id: companyId,
          title: "¡Pago confirmado!",
          message: "Tu acceso completo ha sido activado. ¡Bienvenido a Disruptivaa!",
          type: "success",
        });

        // Send branded confirmation email via Resend
        try {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id, full_name, language")
            .eq("company_id", companyId)
            .limit(1)
            .maybeSingle();

          if (userProfile?.id) {
            const { data: userData } = await supabase.auth.admin.getUserById(userProfile.id);
            const { data: company } = await supabase
              .from("companies")
              .select("name, branding_color, logo_url")
              .eq("id", companyId)
              .maybeSingle();

            const userEmail = userData?.user?.email;
            if (userEmail) {
              await fetch(`${supabaseUrl}/functions/v1/send-branded-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceRoleKey}`,
                },
                body: JSON.stringify({
                  to: userEmail,
                  subject: "Pago confirmado - Disruptivaa",
                  templateName: "payment_success",
                  variables: {
                    clientName: userProfile.full_name || "Cliente",
                    logoUrl: company?.logo_url || "",
                    brandColor: company?.branding_color || "#00A3FF",
                    lang: userProfile.language || "es",
                  },
                }),
              });
              console.log(`Payment confirmation email sent to ${userEmail}`);
            }
          }
        } catch (emailErr) {
          console.error("Non-blocking email error:", emailErr);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId)
          .eq("status", "active");

        if (updateError) {
          console.error("Error updating subscription to past_due:", updateError);
        }

        // Find company_id from subscription
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("company_id")
          .eq("stripe_customer_id", customerId)
          .limit(1)
          .maybeSingle();

        if (sub?.company_id) {
          await supabase.from("notifications").insert({
            company_id: sub.company_id,
            title: "Problema con tu pago",
            message: "Hubo un problema con tu pago. Por favor actualiza tu método de pago.",
            type: "warning",
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        // Find company before updating
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("company_id")
          .eq("stripe_subscription_id", subscriptionId)
          .limit(1)
          .maybeSingle();

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subscriptionId);

        if (updateError) {
          console.error("Error canceling subscription:", updateError);
        }

        if (sub?.company_id) {
          await supabase.from("notifications").insert({
            company_id: sub.company_id,
            title: "Suscripción cancelada",
            message: "Tu suscripción ha sido cancelada. Contacta soporte si necesitas ayuda.",
            type: "info",
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
