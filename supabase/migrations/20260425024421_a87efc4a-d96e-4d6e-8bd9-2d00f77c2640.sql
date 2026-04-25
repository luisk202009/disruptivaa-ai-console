
-- 1. Restrict whatsapp_links public SELECT — remove anon access; redirects use service role via edge function
DROP POLICY IF EXISTS "Public read active links" ON public.whatsapp_links;

-- 2. Prevent role / company_id escalation via profiles UPDATE
DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

-- 3. Drop redundant overly-permissive INSERT policy on companies
-- The 'Users can create their own company' policy + create_company_for_user RPC already cover this safely
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- 4. Fix mutable search_path on remaining functions
CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM whatsapp_links WHERE slug = p_slug
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_whatsapp_links_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
