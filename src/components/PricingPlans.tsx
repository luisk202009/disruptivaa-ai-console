import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Loader2, Infinity, Zap } from "lucide-react";

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

const LimitLabel = ({ value, label }: { value: number; label: string }) => (
  <li className="flex items-center gap-2 text-sm text-zinc-300">
    <Check size={14} className="text-emerald-400 shrink-0" />
    <span>
      {value === -1 ? (
        <><Infinity size={12} className="inline mr-1 text-emerald-400" />Ilimitados</>
      ) : (
        value
      )}{" "}
      {label}
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
        .select("id, name, price, currency, stripe_price_id, max_projects, max_goals_per_project, max_ai_agents, max_dashboards, max_integrations")
        .eq("is_active", true)
        .order("price");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const subscribe = useMutation({
    mutationFn: async (plan: Plan) => {
      if (!profile?.company_id) throw new Error("No company");

      // Create pending subscription
      const { error: subError } = await supabase.from("subscriptions").insert({
        company_id: profile.company_id,
        plan_id: plan.id,
        plan_name: plan.name,
        price: plan.price,
        currency: plan.currency,
        billing_cycle: "monthly",
        status: "pending",
      });
      if (subError) throw subError;

      if (!plan.stripe_price_id) {
        toast.success("Suscripción creada. Contacta al equipo para activarla.");
        return;
      }

      // Call edge function for Stripe checkout
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan_id: plan.id,
          company_id: profile.company_id,
          price_id: plan.stripe_price_id,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      console.error("Subscribe error:", err);
      toast.error("Error al iniciar el pago. Intenta de nuevo.");
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => {
          const isPopular = i === 1;
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
              <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-sm text-muted-foreground"> /mes</span>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <LimitLabel value={plan.max_projects} label="proyectos" />
                <LimitLabel value={plan.max_goals_per_project} label="metas por proyecto" />
                <LimitLabel value={plan.max_ai_agents} label="agentes IA" />
                <LimitLabel value={plan.max_dashboards} label="paneles" />
                <LimitLabel value={plan.max_integrations} label="integraciones" />
              </ul>
              <Button
                onClick={() => {
                  if (!session) {
                    navigate(`/lista-de-espera?plan=${plan.id}`);
                    return;
                  }
                  subscribe.mutate(plan);
                }}
                disabled={subscribe.isPending}
                variant={isPopular ? "default" : "outline"}
                className={`w-full ${isPopular ? "" : "border-white/10"}`}
              >
                {subscribe.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Zap size={14} className="mr-2" />
                )}
                {session ? "Suscribirse" : "Únete a la lista de espera"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricingPlans;
