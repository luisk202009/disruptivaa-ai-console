
-- Revoke EXECUTE on all SECURITY DEFINER functions from PUBLIC/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.check_slug_available(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_proposal_viewed(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_lead_and_brief(text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_proposal(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_company_for_user(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon, authenticated;

-- Re-grant EXECUTE only to the roles that legitimately invoke each RPC.

-- Public endpoints (used by unauthenticated flows: slug check, brief form, public proposals)
GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_lead_and_brief(text, text, text, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_proposal(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_proposal_viewed(text) TO anon, authenticated;

-- Authenticated-only RPCs
GRANT EXECUTE ON FUNCTION public.create_company_for_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

-- has_role is used inside RLS policies; policies run as the invoker but the SECURITY DEFINER
-- function itself is safe to call. Grant to authenticated so policies can evaluate it.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Trigger-only functions (handle_new_user, sync_profile_email, protect_profile_role)
-- remain without any client EXECUTE; triggers invoke them internally.
