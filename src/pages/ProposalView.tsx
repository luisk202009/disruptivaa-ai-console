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

    const fetch = async () => {
      const { data, error } = await supabase
        .from("proposals" as any)
        .select("html_content, status")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setHtml((data as any).html_content);
      setLoading(false);

      // Mark as viewed
      if ((data as any).status === "sent") {
        await supabase.rpc("mark_proposal_viewed" as any, { _slug: slug });
      }
    };

    fetch();
  }, [slug]);

  // Auto-resize iframe
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
