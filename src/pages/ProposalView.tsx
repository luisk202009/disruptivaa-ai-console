import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const paymentTypeLabels: Record<string, string> = {
  one_time: "Pago Único",
  monthly: "Mensual",
  annual: "Anual",
  custom: "Acuerdo de pago",
};

const ProposalView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      // 1. Fetch proposal via secure RPC (slug acts as unguessable token)
      const { data, error } = await supabase
        .rpc("get_public_proposal" as any, { _slug: slug });

      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const d = row as any;
      const companyName = d.company_name || "";
      const serviceType = d.service_type || "";

      // 2. Try to get template from DB
      let template: string | null = null;
      if (serviceType) {
        const { data: tplData } = await supabase
          .from("proposal_templates" as any)
          .select("html_content")
          .eq("service_type", serviceType)
          .single();
        if (tplData && (tplData as any).html_content?.trim()) {
          template = (tplData as any).html_content;
        }
      }

      // 3. Fallback to static file
      if (!template) {
        const res = await fetch("/proposal-template.html");
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        template = await res.text();
      }

      // 4. Format date
      const dateFormatted = d.proposal_date
        ? new Date(d.proposal_date + "T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" })
        : "2026";
      const dateCapitalized = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

      // 5. Inject placeholders
      const ctaPrimary = d.cta_primary_url || "#";
      const ctaSecondary = d.cta_secondary_url || "https://www.disruptivaa.com";
      const finalHtml = template
        .split("{{COMPANY_NAME}}").join(companyName)
        .split("{{CTA_PRIMARY_URL}}").join(ctaPrimary)
        .split("{{CTA_SECONDARY_URL}}").join(ctaSecondary)
        .split("{{PROPOSAL_DATE}}").join(dateCapitalized)
        .split("{{PRICE}}").join(d.price || "—")
        .split("{{PAYMENT_TYPE_LABEL}}").join(paymentTypeLabels[d.payment_type] || "Pago Único")
        .split("{{TERMS_CONDITIONS}}").join(d.terms_conditions || "")
        .split("{{TERMS_DISPLAY}}").join((d.terms_conditions || "").trim() ? "block" : "none");

      setHtml(finalHtml);
      setLoading(false);

      // 6. Mark as viewed
      if (d.status === "sent") {
        await supabase.rpc("mark_proposal_viewed", { _slug: slug });
      }
    };

    load();
  }, [slug]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    const handleLoad = () => {
      try {
        const body = iframe.contentDocument?.body;
        if (body) {
          iframe.style.height = body.scrollHeight + "px";
        }
      } catch {
        // cross-origin fallback
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [html]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Propuesta no encontrada</h1>
          <p className="text-gray-500">El enlace puede haber expirado o no existe.</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      sandbox="allow-same-origin"
      className="w-full min-h-screen border-0"
      title="Propuesta"
      style={{ display: "block" }}
    />
  );
};

export default ProposalView;
