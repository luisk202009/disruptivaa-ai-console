CREATE POLICY "Users can update their own company"
ON public.companies FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);