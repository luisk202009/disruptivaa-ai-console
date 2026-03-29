DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.ai_agent_logs;

CREATE POLICY "Users can view their company logs"
ON public.ai_agent_logs FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);