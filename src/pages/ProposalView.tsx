import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ProposalView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      // 1. Fetch proposal from DB
      const { data, error } = await supabase
        .from("proposals" as any)
        .select("company_name, status, cta_primary_url, cta_secondary_url")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const companyName = (data as any).company_name || "";

      // 2. Fetch template
      const res = await fetch("/proposal-template.html");
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const template = await res.text();

      // 3. Inject company name
      const finalHtml = template.split("{{COMPANY_NAME}}").join(companyName);
      setHtml(finalHtml);
      setLoading(false);

      // 4. Mark as viewed
      if ((data as any).status === "sent") {
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
