
-- Configuración singleton para HubSpot
CREATE TABLE public.hubspot_sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  auto_sync boolean NOT NULL DEFAULT false,
  field_mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hubspot_sync_config TO authenticated;
GRANT ALL ON public.hubspot_sync_config TO service_role;

ALTER TABLE public.hubspot_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan config HubSpot"
ON public.hubspot_sync_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_hubspot_sync_config_updated_at
BEFORE UPDATE ON public.hubspot_sync_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Historial de sincronizaciones
CREATE TABLE public.hubspot_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  hubspot_contact_id text,
  action text NOT NULL,
  error_message text,
  synced_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hubspot_sync_log TO authenticated;
GRANT ALL ON public.hubspot_sync_log TO service_role;

ALTER TABLE public.hubspot_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven historial HubSpot"
ON public.hubspot_sync_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_hubspot_sync_log_lead_id ON public.hubspot_sync_log(lead_id);
CREATE INDEX idx_hubspot_sync_log_synced_at ON public.hubspot_sync_log(synced_at DESC);

-- Columna en leads para tracking
ALTER TABLE public.leads ADD COLUMN hubspot_contact_id text;

-- Fila inicial de configuración con mapeo por defecto
INSERT INTO public.hubspot_sync_config (enabled, auto_sync, field_mapping)
VALUES (
  false,
  false,
  '{
    "email": "email",
    "name": "firstname",
    "phone": "phone",
    "company": "company",
    "website": "website",
    "service_type": "disruptivaa_servicios",
    "niche": "disruptivaa_nicho",
    "status": "lifecyclestage",
    "fit_score": "disruptivaa_fit_score",
    "source": "hs_analytics_source",
    "notes": "disruptivaa_notas"
  }'::jsonb
);
