
-- Crear tabla brief_submissions
CREATE TABLE public.brief_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.brief_submissions ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar briefs
CREATE POLICY "Anyone can insert brief submissions"
  ON public.brief_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins pueden ver y gestionar todos los briefs
CREATE POLICY "Admins can manage brief submissions"
  ON public.brief_submissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
