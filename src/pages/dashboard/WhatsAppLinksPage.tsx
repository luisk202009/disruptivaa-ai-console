import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MessageCircle,
  Copy,
  BarChart3,
  Pencil,
  QrCode,
  Trash2,
} from "lucide-react";
import {
  useWhatsAppLinks,
  useToggleLinkActive,
  useDeleteWhatsAppLink,
  WhatsAppLinkAnalyticsRow,
} from "@/hooks/useWhatsAppLinks";
import { buildShortLink } from "@/lib/walink";
import WhatsAppQRModal from "@/components/whatsapp/WhatsAppQRModal";

const WhatsAppLinksPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useWhatsAppLinks();
  const toggle = useToggleLinkActive();
  const del = useDeleteWhatsAppLink();
  const [qrSlug, setQrSlug] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(buildShortLink(slug));
    toast.success("Link copiado");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                <MessageCircle className="text-[#25D366]" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">WhatsApp Links</h1>
                <p className="text-sm text-muted-foreground">
                  Crea, gestiona y analiza tus links cortos de WhatsApp.
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                navigate("/dashboard/ecosistema/whatsapp-links/nuevo")
              }
            >
              <Plus size={16} className="mr-2" />
              Nuevo link
            </Button>
          </header>

          {isLoading ? (
            <Card className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </Card>
          ) : !data || data.length === 0 ? (
            <Card className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-4">
                <MessageCircle className="text-[#25D366]" size={28} />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Aún no tienes links
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Crea tu primer link corto de WhatsApp con QR personalizado y
                analítica detallada.
              </p>
              <Button
                onClick={() =>
                  navigate("/dashboard/ecosistema/whatsapp-links/nuevo")
                }
              >
                <Plus size={16} className="mr-2" />
                Crear tu primer link
              </Button>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Link</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Clics</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row: WhatsAppLinkAnalyticsRow) => (
                    <TableRow key={row.link_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            …/{row.slug}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => copyLink(row.slug)}
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">+{row.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {row.link_type === "catalog" ? "Catálogo" : "Chat"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.total_clicks}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={row.is_active}
                          onCheckedChange={(c) =>
                            toggle.mutate({ id: row.link_id, isActive: c })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              navigate(
                                `/dashboard/ecosistema/whatsapp-links/${row.link_id}/analitica`
                              )
                            }
                            title="Analítica"
                          >
                            <BarChart3 size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              navigate(
                                `/dashboard/ecosistema/whatsapp-links/${row.link_id}/editar`
                              )
                            }
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setQrSlug(row.slug)}
                            title="QR"
                          >
                            <QrCode size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(row.link_id)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </main>

      {qrSlug && (
        <WhatsAppQRModal
          open={!!qrSlug}
          onOpenChange={(o) => !o && setQrSlug(null)}
          slug={qrSlug}
        />
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar link?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El link dejará de funcionar
              inmediatamente y se perderán las estadísticas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  del.mutate(deleteId, {
                    onSuccess: () => toast.success("Link eliminado"),
                    onError: (e: any) => toast.error(e.message),
                  });
                }
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WhatsAppLinksPage;
