ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT '';

DROP POLICY IF EXISTS "Public can view sent proposals" ON public.proposals;
CREATE POLICY "Public can view sent proposals"
  ON public.proposals FOR SELECT TO anon, authenticated
  USING (status IN ('sent', 'viewed', 'accepted', 'rejected'));