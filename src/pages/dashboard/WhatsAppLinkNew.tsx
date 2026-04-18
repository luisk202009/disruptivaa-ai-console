import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import WhatsAppLinkForm from "@/components/whatsapp/WhatsAppLinkForm";

const WhatsAppLinkNew = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-3"
            onClick={() => navigate("/dashboard/ecosistema/whatsapp-links")}
          >
            <ChevronLeft size={14} className="mr-1" />
            Mis links
          </Button>
          <h1 className="text-2xl font-semibold mb-6">Nuevo link de WhatsApp</h1>
          <WhatsAppLinkForm />
        </div>
      </main>
    </div>
  );
};

export default WhatsAppLinkNew;
