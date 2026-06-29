
-- Revocar EXECUTE por defecto en todas las funciones SECURITY DEFINER del esquema public
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_proposal_viewed(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_proposal(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_lead_and_brief(text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_company_for_user(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_slug_available(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon, authenticated;

-- Otorgar EXECUTE únicamente a los roles que realmente necesitan llamarlas
-- RPC públicas (captura de leads, vista pública de propuestas, slugs de WhatsApp)
GRANT EXECUTE ON FUNCTION public.upsert_lead_and_brief(text, text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_proposal(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_proposal_viewed(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO anon, authenticated;

-- RPC sólo para usuarios autenticados
GRANT EXECUTE ON FUNCTION public.create_company_for_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
-- has_role se usa internamente en políticas RLS; el motor lo ejecuta como SECURITY DEFINER sin grant explícito al rol del usuario
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Triggers (handle_new_user, sync_profile_email, protect_profile_role) no requieren EXECUTE para roles cliente
