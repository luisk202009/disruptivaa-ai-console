
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);
