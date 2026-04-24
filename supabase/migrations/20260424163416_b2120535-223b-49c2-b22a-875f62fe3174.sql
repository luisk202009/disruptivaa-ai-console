-- Tabla para recordar grants de la lista de espera pendientes de aplicar
CREATE TABLE IF NOT EXISTS public.pending_waitlist_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  lead_id uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);

ALTER TABLE public.pending_waitlist_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage waitlist grants"
  ON public.pending_waitlist_grants
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Índice para búsquedas rápidas por email desde la edge function
CREATE INDEX IF NOT EXISTS idx_pending_waitlist_grants_email
  ON public.pending_waitlist_grants (email)
  WHERE applied_at IS NULL;

-- Plan gratuito de 1 año para invitados de la lista de espera
INSERT INTO public.plans
  (name, price, currency, max_projects, max_goals_per_project, max_ai_agents,
   max_dashboards, max_integrations, is_active)
SELECT
  'Waitlist Free Year', 0, 'USD', 5, -1, -1, 3, -1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.plans WHERE name = 'Waitlist Free Year'
);