
-- Create plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  max_projects integer DEFAULT -1,
  max_goals_per_project integer DEFAULT -1,
  max_ai_agents integer DEFAULT -1,
  max_dashboards integer DEFAULT -1,
  max_integrations integer DEFAULT -1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on plans" ON public.plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Updated_at trigger
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add plan_id FK to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN plan_id uuid REFERENCES public.plans(id);

-- Seed default plans
INSERT INTO public.plans (name, max_projects, max_goals_per_project, max_ai_agents, max_dashboards, max_integrations)
VALUES
  ('Starter', 2, 3, 1, 1, 1),
  ('Growth', 10, 10, 3, 5, 3),
  ('Enterprise', -1, -1, -1, -1, -1);
