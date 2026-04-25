-- 1. Remove public SELECT on proposals table
DROP POLICY IF EXISTS "Public can view sent proposals" ON public.proposals;

-- 2. Create SECURITY DEFINER function to fetch a single proposal by slug
-- This only returns proposals in publicly-shareable statuses, exposes only needed fields,
-- and the slug acts as an unguessable access token.
CREATE OR REPLACE FUNCTION public.get_public_proposal(_slug text)
RETURNS TABLE (
  company_name text,
  status text,
  cta_primary_url text,
  cta_secondary_url text,
  service_type text,
  price text,
  payment_type text,
  terms_conditions text,
  proposal_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.company_name,
    p.status,
    p.cta_primary_url,
    p.cta_secondary_url,
    p.service_type,
    p.price,
    p.payment_type,
    p.terms_conditions,
    p.proposal_date
  FROM public.proposals p
  WHERE p.slug = _slug
    AND p.status IN ('sent', 'viewed', 'accepted', 'rejected')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_proposal(text) TO anon, authenticated;

-- 3. Ensure pending_waitlist_grants has no implicit access for non-admins
-- (Already restricted; add a defensive explicit policy doc via comment)
COMMENT ON TABLE public.pending_waitlist_grants IS 'Admin-only access. No SELECT policy exists for non-admin users — RLS denies by default.';