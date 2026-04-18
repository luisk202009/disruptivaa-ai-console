import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, Loader2 } from "lucide-react";
import { WA_REDIRECT_BASE_URL } from "@/lib/walink";

const WaRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError(true);
      return;
    }

    // Trigger browser-level redirect: edge function responds with 302 to wa.me
    // and registers the click. fetch() would not open WhatsApp.
    window.location.replace(`${WA_REDIRECT_BASE_URL}/${slug}`);

    // Safety timeout: if still on this page after 5s, show error
    const timer = setTimeout(() => setError(true), 5000);
    return () => clearTimeout(timer);
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#25D36620" }}
          >
            <MessageCircle size={32} style={{ color: "#25D366" }} />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Link no encontrado
          </h1>
          <p className="text-sm text-gray-600">
            El enlace al que intentas acceder no existe o ha sido desactivado.
          </p>
          <a
            href="https://www.disruptivaa.com/whatsapp-link"
            className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-md text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            Crear mi propio link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#25D36615" }}
        >
          <MessageCircle size={40} style={{ color: "#25D366" }} />
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 size={16} className="animate-spin" />
          <p className="text-base font-medium">Redirigiendo...</p>
        </div>
      </div>
    </div>
  );
};

export default WaRedirect;
