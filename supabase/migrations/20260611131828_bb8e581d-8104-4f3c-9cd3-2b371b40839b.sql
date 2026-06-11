
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings públicos para lectura"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings insert solo admin"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_settings update solo admin"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_settings delete solo admin"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value)
VALUES ('whatsapp_floating_button', '{"phone":"","message":"","enabled":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
