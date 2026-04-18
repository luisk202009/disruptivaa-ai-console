import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import WhatsAppLinkForm from "@/components/whatsapp/WhatsAppLinkForm";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLinks";

const WhatsAppLinkEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useWhatsAppLink(id);

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
          <h1 className="text-2xl font-semibold mb-6">Editar link</h1>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : data ? (
            <WhatsAppLinkForm initial={data} isEdit />
          ) : (
            <p className="text-muted-foreground">Link no encontrado.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default WhatsAppLinkEdit;
