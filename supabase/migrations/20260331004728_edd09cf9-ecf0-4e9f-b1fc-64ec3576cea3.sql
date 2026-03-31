ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS cta_primary_url text DEFAULT '';
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS cta_secondary_url text DEFAULT '';