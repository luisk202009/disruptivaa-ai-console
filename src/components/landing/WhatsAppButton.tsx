import { MessageCircle } from "lucide-react";
import {
  useSiteSetting,
  WHATSAPP_BUTTON_KEY,
  WhatsAppButtonSettings,
} from "@/hooks/useSiteSetting";
import { buildWaUrl } from "@/lib/walink";

const WhatsAppButton = () => {
  const { data } = useSiteSetting<WhatsAppButtonSettings>(WHATSAPP_BUTTON_KEY);

  // Sin configuración o deshabilitado: no renderizar
  if (!data || data.enabled === false || !data.phone) return null;

  const href = buildWaUrl(data.phone, data.message ?? "", "chat");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center shadow-lg shadow-black/30 transition-transform hover:scale-110"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  );
};

export default WhatsAppButton;
