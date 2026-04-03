ALTER TABLE public.plans ADD COLUMN price numeric DEFAULT 0;
ALTER TABLE public.plans ADD COLUMN currency text DEFAULT 'USD';
ALTER TABLE public.plans ADD COLUMN stripe_price_id text;