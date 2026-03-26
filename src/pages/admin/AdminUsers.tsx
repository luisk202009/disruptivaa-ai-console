import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AdminProfile {
  id: string;
  role: string | null;
  company_id: string | null;
  language: string | null;
  full_name: string | null;
  created_at: string | null;
}

const AdminUsers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: companies } = useQuery({
    queryKey: ["admin_companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allProfiles, isLoading } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, company_id, language, full_name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminProfile[];
    },
  });

  const { data: allRoles } = useQuery({
    queryKey: ["admin_user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const adminUserIds = new Set(allRoles?.filter(r => r.role === "admin").map(r => r.user_id) ?? []);
  const companyMap = new Map(companies?.map(c => [c.id, c.name]) ?? []);

  const promoteToAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as const });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] }); toast.success(t("admin.promoted")); },
    onError: () => toast.error(t("admin.websiteError")),
  });

  const revokeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin_user_roles"] }); toast.success(t("admin.revoked")); },
    onError: () => toast.error(t("admin.websiteError")),
  });

  const handleToggleAdmin = (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) revokeAdmin.mutate(userId);
    else promoteToAdmin.mutate(userId);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-foreground tracking-wide mb-1">Usuarios</h1>
      <p className="text-sm text-muted-foreground mb-8">Gestiona los usuarios y permisos de administración.</p>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !allProfiles?.length ? (
        <p className="text-muted-foreground text-center py-16">No users found.</p>
      ) : (
        <div className="border border-white/[0.06] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.userName")}</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.role")}</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider">{t("admin.company")}</TableHead>
                <TableHead className="text-zinc-400 text-xs uppercase tracking-wider text-right">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProfiles.map((profile) => {
                const isAlreadyAdmin = adminUserIds.has(profile.id);
                return (
                  <TableRow key={profile.id} className="border-white/[0.06]">
                    <TableCell className="text-foreground font-medium">{profile.full_name || profile.id.slice(0, 8) + "…"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs border-white/10">{profile.role || "client"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{profile.company_id ? (companyMap.get(profile.company_id) || profile.company_id.slice(0, 8)) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Switch checked={isAlreadyAdmin} onCheckedChange={() => handleToggleAdmin(profile.id, isAlreadyAdmin)} disabled={promoteToAdmin.isPending || revokeAdmin.isPending} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
