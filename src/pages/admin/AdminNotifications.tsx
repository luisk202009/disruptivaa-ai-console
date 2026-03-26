import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Send, Trash2 } from "lucide-react";

const NOTIFICATION_TYPES = ["info", "warning", "success", "error"] as const;

const notifTypeBadgeClass: Record<string, string> = {
  info: "border-blue-500/30 text-blue-400",
  warning: "border-amber-500/30 text-amber-400",
  success: "border-green-500/30 text-green-400",
  error: "border-red-500/30 text-red-400",
};

const AdminNotifications = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifType, setNotifType] = useState("info");
  const [notifCompany, setNotifCompany] = useState("all");

  const { data: companies } = useQuery({
    queryKey: ["admin_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: adminNotifications, isLoading } = useQuery({
    queryKey: ["admin_notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const companyMap = new Map(companies?.map(c => [c.id, c.name]) ?? []);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">Notificaciones</h1>
      <p className="text-sm text-muted-foreground mb-8">Envía y gestiona notificaciones para las empresas.</p>

      <div className="space-y-6">
        {/* Send notification form */}
        <div className="p-5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4"><Send size={18} className="text-primary" /><h3 className="font-medium text-foreground">{t("notifications.sendNotification")}</h3></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder={t("notifications.notifTitle")} className="bg-white/[0.03] border-white/[0.08]" />
            <Select value={notifType} onValueChange={setNotifType}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder={t("notifications.notifType")} /></SelectTrigger>
              <SelectContent>{NOTIFICATION_TYPES.map((nt) => (<SelectItem key={nt} value={nt} className="capitalize">{nt}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <Textarea value={notifBody} onChange={(e) => setNotifBody(e.target.value)} placeholder={t("notifications.notifBody")} className="bg-white/[0.03] border-white/[0.08] mb-3" rows={3} />
          <div className="flex gap-3 mb-4">
            <Select value={notifCompany} onValueChange={setNotifCompany}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08]"><SelectValue placeholder={t("notifications.destination")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("notifications.allCompanies")}</SelectItem>
                {companies?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={async () => {
              const { error } = await supabase.from("notifications").insert({
                title: notifTitle, message: notifBody, type: notifType,
                company_id: notifCompany === "all" ? null : notifCompany,
              });
              if (error) { toast.error(t("admin.websiteError")); return; }
              queryClient.invalidateQueries({ queryKey: ["admin_notifications"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              setNotifTitle(""); setNotifBody(""); setNotifType("info"); setNotifCompany("all");
              toast.success(t("notifications.sent"));
            }}
            disabled={!notifTitle || !notifBody}
            className="w-full"
          >
            <Send size={14} className="mr-2" />{t("notifications.sendNotification")}
          </Button>
        </div>

        {/* Sent notifications table */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !adminNotifications?.length ? (
          <p className="text-muted-foreground text-center py-10">{t("notifications.noNotifications")}</p>
        ) : (
          <div className="border border-white/[0.06] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-transparent">
                  <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("notifications.notifTitle")}</TableHead>
                  <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("notifications.notifType")}</TableHead>
                  <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("notifications.destination")}</TableHead>
                  <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminNotifications.map((notif: any) => (
                  <TableRow key={notif.id} className="border-white/[0.06]">
                    <TableCell className="text-foreground font-medium">{notif.title}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-xs capitalize ${notifTypeBadgeClass[notif.type] || "border-white/10"}`}>{notif.type}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{notif.company_id ? (companyMap.get(notif.company_id) || notif.company_id.slice(0, 8)) : t("notifications.global")}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={async () => {
                        const { error } = await supabase.from("notifications").delete().eq("id", notif.id);
                        if (!error) { queryClient.invalidateQueries({ queryKey: ["admin_notifications"] }); queryClient.invalidateQueries({ queryKey: ["notifications"] }); }
                      }} className="text-zinc-500 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
