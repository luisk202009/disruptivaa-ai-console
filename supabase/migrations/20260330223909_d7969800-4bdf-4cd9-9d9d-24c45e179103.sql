
-- Tabla de propuestas
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  html_content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Lectura pública para propuestas enviadas/vistas
CREATE POLICY "Public can view sent proposals"
  ON public.proposals FOR SELECT TO anon, authenticated
  USING (status IN ('sent', 'viewed'));

-- Admin tiene acceso total
CREATE POLICY "Admins have full access to proposals"
  ON public.proposals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función RPC para marcar propuesta como vista (anónimo)
CREATE OR REPLACE FUNCTION public.mark_proposal_viewed(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE proposals
  SET status = 'viewed'
  WHERE slug = _slug AND status = 'sent';
END;
$$;
