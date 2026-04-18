
-- 1. Vista de analytics
DROP VIEW IF EXISTS public.whatsapp_link_analytics;
CREATE VIEW public.whatsapp_link_analytics
WITH (security_invoker = true)
AS
SELECT
  l.id AS link_id,
  l.user_id,
  l.slug,
  l.phone,
  l.link_type,
  l.is_active,
  l.created_at,
  COALESCE(c.total_clicks, 0) AS total_clicks,
  COALESCE(c.unique_clicks, 0) AS unique_clicks,
  c.last_click_at
FROM public.whatsapp_links l
LEFT JOIN (
  SELECT
    link_id,
    COUNT(*) AS total_clicks,
    COUNT(DISTINCT ip_hash) AS unique_clicks,
    MAX(clicked_at) AS last_click_at
  FROM public.whatsapp_link_clicks
  GROUP BY link_id
) c ON c.link_id = l.id;

-- 2. Permitir INSERT anónimo en whatsapp_links (user_id NULL)
DROP POLICY IF EXISTS "Anyone can insert anonymous links" ON public.whatsapp_links;
CREATE POLICY "Anyone can insert anonymous links"
ON public.whatsapp_links
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NOT NULL AND user_id IS NULL)
);

-- Drop old restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own links" ON public.whatsapp_links;
