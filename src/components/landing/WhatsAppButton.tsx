import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/PHONE_NUMBER"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white flex items-center justify-center shadow-lg shadow-black/30 transition-transform hover:scale-110"
    aria-label="Contactar por WhatsApp"
  >
    <MessageCircle size={26} />
  </a>
);

export default WhatsAppButton;
