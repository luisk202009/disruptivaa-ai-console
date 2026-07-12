import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Loader2, Infinity, Zap, Sparkles, Gift } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  stripe_price_id: string | null;
  max_projects: number;
  max_goals_per_project: number;
  max_ai_agents: number;
  max_dashboards: number;
  max_integrations: number;
}

const formatLimit = (value: number) =>
  value === -1 ? (
    <>
      <Infinity size={12} className="inline mr-1 text-emerald-400" />
      Ilimitados
    </>
  ) : (
    value
  );

const LimitLabel = ({ value, label }: { value: number; label: string }) => (
  <li className="flex items-center gap-2 text-sm text-zinc-300">
    <Check size={14} className="text-emerald-400 shrink-0" />
    <span>
      {formatLimit(value)} {label}
    </span>
  </li>
);

const PricingPlans = () => {
  const { session } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["active_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(
          "id, name, price, currency, stripe_price_id, max_projects, max_goals_per_project, max_ai_agents, max_dashboards, max_integrations",
        )
        .eq("is_active", true)
        .order("price");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const subscribe = useMutation({
    mutationFn: async (plan: Plan) => {
      if (!profile?.company_id) {
        // Fallback defensivo — el ruteo previo debería haber evitado llegar aquí
        throw new Error(
          "Necesitas completar el onboarding de tu empresa antes de suscribirte.",
        );
      }

      if (!plan.stripe_price_id) {
        throw new Error(
          "Este plan aún no tiene configurado un precio en Stripe. Contáctanos para activarlo.",
        );
      }

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            plan_id: plan.id,
            company_id: profile.company_id,
            price_id: plan.stripe_price_id,
          },
        },
      );

      if (error) {
        // Intenta extraer el mensaje real del edge function
        let details = error.message;
        try {
          // @ts-ignore - context puede existir en FunctionsHttpError
          if (error.context?.text) {
            details = await error.context.text();
          }
        } catch (_) {
          /* noop */
        }
        console.error("[checkout] edge error:", details);
        throw new Error(details || "No se pudo iniciar el pago.");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe no devolvió una URL de pago.");
      }
    },
    onError: (err: Error) => {
      console.error("Subscribe error:", err);
      toast.error(err.message || "Error al iniciar el pago. Intenta de nuevo.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plans?.length) return null;

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);

  // Separa el plan de Waitlist / gratuito del resto
  const isWaitlist = (p: Plan) =>
    p.price === 0 || /waitlist|free/i.test(p.name);

  const waitlistPlan = plans.find(isWaitlist);
  const paidPlans = plans.filter((p) => !isWaitlist(p)).slice(0, 3);

  const handleSubscribe = (plan: Plan) => {
    if (!session) {
      navigate(`/auth?plan=${plan.id}`);
      return;
    }
    subscribe.mutate(plan);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12">
      {/* Grid principal — 3 planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paidPlans.map((plan, i) => {
          const isPopular = i === 1 && paidPlans.length >= 2;
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-6 flex flex-col ${
                isPopular
                  ? "border-primary/40 bg-primary/[0.04]"
                  : "border-white/[0.08] bg-white/[0.02]"
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2">
                  Popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-sm text-muted-foreground"> /mes</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <LimitLabel value={plan.max_projects} label="proyectos" />
                <LimitLabel
                  value={plan.max_goals_per_project}
                  label="metas por proyecto"
                />
                <LimitLabel value={plan.max_ai_agents} label="agentes IA" />
                <LimitLabel value={plan.max_dashboards} label="paneles" />
                <LimitLabel
                  value={plan.max_integrations}
                  label="integraciones"
                />
              </ul>
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={subscribe.isPending}
                variant={isPopular ? "default" : "outline"}
                className={`w-full ${isPopular ? "" : "border-white/10"}`}
              >
                {subscribe.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Zap size={14} className="mr-2" />
                )}
                {session ? "Suscribirse" : "Comenzar"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Oferta especial — Waitlist Free Year */}
      {waitlistPlan && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] via-primary/[0.05] to-transparent p-8 md:p-10">
          {/* Glow decorativo */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-4">
                <Sparkles size={12} />
                Oferta especial · Tiempo limitado
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Gift size={24} className="text-emerald-400" />
                {waitlistPlan.name}
              </h3>
              <p className="text-muted-foreground text-base mb-5 max-w-2xl">
                Únete temprano y obtén <span className="text-emerald-300 font-semibold">1 año completo gratis</span>.
                Acceso anticipado a la plataforma con beneficios exclusivos para los primeros usuarios.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  {formatLimit(waitlistPlan.max_projects)} proyectos
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  {formatLimit(waitlistPlan.max_ai_agents)} agentes IA
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  {formatLimit(waitlistPlan.max_dashboards)} paneles
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  {formatLimit(waitlistPlan.max_goals_per_project)} metas / proyecto
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  {formatLimit(waitlistPlan.max_integrations)} integraciones
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end gap-3 lg:min-w-[220px]">
              <div>
                <div className="text-4xl font-bold text-foreground">$0</div>
                <div className="text-xs text-muted-foreground">
                  durante 12 meses
                </div>
              </div>
              <Button
                onClick={() => navigate(`/auth?plan=${waitlistPlan.id}`)}
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 w-full lg:w-auto"
              >
                <Sparkles size={14} className="mr-2" />
                Reclamar oferta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlans;
