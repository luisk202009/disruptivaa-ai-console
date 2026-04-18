import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  formatDistanceToNow,
  format,
  startOfDay,
  eachDayOfInterval,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, Smartphone, Monitor, Globe } from "lucide-react";
import {
  useWhatsAppLink,
  useWhatsAppLinkClicks,
} from "@/hooks/useWhatsAppLinks";

const WhatsAppLinkAnalytics = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: link, isLoading: linkLoading } = useWhatsAppLink(id);
  const { data: clicks, isLoading: clicksLoading } = useWhatsAppLinkClicks(id);

  const stats = useMemo(() => {
    if (!clicks) return { total: 0, unique: 0, last: null as string | null };
    const ips = new Set(clicks.map((c) => c.ip_hash).filter(Boolean));
    const last = clicks[0]?.clicked_at ?? null;
    return { total: clicks.length, unique: ips.size, last };
  }, [clicks]);

  const chartData = useMemo(() => {
    if (!clicks) return [];
    const end = startOfDay(new Date());
    const start = subDays(end, 29);
    const buckets = new Map<string, number>();
    eachDayOfInterval({ start, end }).forEach((d) =>
      buckets.set(format(d, "yyyy-MM-dd"), 0)
    );
    clicks.forEach((c) => {
      const key = format(startOfDay(new Date(c.clicked_at)), "yyyy-MM-dd");
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date: format(new Date(date), "dd MMM", { locale: es }),
      clicks: count,
    }));
  }, [clicks]);

  const recentClicks = (clicks ?? []).slice(0, 50);

  const deviceIcon = (d: string | null) => {
    if (d === "mobile") return <Smartphone size={14} />;
    if (d === "desktop") return <Monitor size={14} />;
    return <Globe size={14} />;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8 space-y-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-3"
              onClick={() => navigate("/dashboard/ecosistema/whatsapp-links")}
            >
              <ChevronLeft size={14} className="mr-1" />
              Volver a mis links
            </Button>
            <h1 className="text-2xl font-semibold">
              Analítica · {linkLoading ? "..." : link?.slug}
            </h1>
            <p className="text-sm text-muted-foreground">
              Estadísticas de los últimos 30 días.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-normal">
                  Total de clics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clicksLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-3xl font-semibold">{stats.total}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-normal">
                  Clics únicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clicksLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <p className="text-3xl font-semibold">{stats.unique}</p>
                    <p className="text-xs text-muted-foreground">IPs únicas</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-normal">
                  Último clic
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clicksLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-lg font-medium">
                    {stats.last
                      ? formatDistanceToNow(new Date(stats.last), {
                          addSuffix: true,
                          locale: es,
                        })
                      : "Sin clics aún"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clics por día</CardTitle>
            </CardHeader>
            <CardContent>
              {clicksLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="#25D366"
                        strokeWidth={2}
                        dot={{ fill: "#25D366", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent clicks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clics recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {clicksLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentClicks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Sin clics registrados todavía.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Referrer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentClicks.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">
                          {format(new Date(c.clicked_at), "dd MMM yyyy HH:mm", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2 text-sm capitalize">
                            {deviceIcon(c.device_type)}
                            {c.device_type ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.country ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                          {c.referrer || "Directo"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WhatsAppLinkAnalytics;
