
-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  stripe_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own company's subscriptions
CREATE POLICY "Users can view their company subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
