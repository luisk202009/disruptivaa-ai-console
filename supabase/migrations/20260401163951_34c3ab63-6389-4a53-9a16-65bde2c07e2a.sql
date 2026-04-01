
-- 1. Create proposal_templates table
CREATE TABLE public.proposal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL UNIQUE,
  html_content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins have full access to proposal_templates"
ON public.proposal_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can read templates (needed for rendering)
CREATE POLICY "Anyone can view proposal templates"
ON public.proposal_templates
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Add new columns to proposals
ALTER TABLE public.proposals
  ADD COLUMN service_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN price TEXT NOT NULL DEFAULT '',
  ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'one_time',
  ADD COLUMN terms_conditions TEXT NOT NULL DEFAULT '',
  ADD COLUMN proposal_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- 3. Seed default template
INSERT INTO public.proposal_templates (name, service_type, html_content)
VALUES ('Ecosistema Digital 30 Días', 'digital_30_dias', '');
