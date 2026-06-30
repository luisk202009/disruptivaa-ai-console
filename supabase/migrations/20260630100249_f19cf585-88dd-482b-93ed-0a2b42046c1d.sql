
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS hubspot_company_id text;
ALTER TABLE public.hubspot_sync_log ADD COLUMN IF NOT EXISTS object_type text;

-- Reescribir el mapeo al nuevo formato {property, object}
UPDATE public.hubspot_sync_config
SET field_mapping = jsonb_build_object(
  'email',        jsonb_build_object('property', 'email',                   'object', 'contact'),
  'name',         jsonb_build_object('property', 'firstname',               'object', 'contact'),
  'phone',        jsonb_build_object('property', 'phone',                   'object', 'contact'),
  'notes',        jsonb_build_object('property', 'disruptivaa_notes',       'object', 'contact'),
  'fit_score',    jsonb_build_object('property', 'disruptivaa_fit_score',   'object', 'contact'),
  'niche',        jsonb_build_object('property', 'disruptivaa_nicho',       'object', 'contact'),
  'service_type', jsonb_build_object('property', 'disruptivaa_servicios',   'object', 'contact'),
  'status',       jsonb_build_object('property', 'lifecyclestage',          'object', 'contact'),
  'source',       jsonb_build_object('property', 'disruptivaa_source',      'object', 'contact'),
  'company',      jsonb_build_object('property', 'name',                    'object', 'company'),
  'website',      jsonb_build_object('property', 'domain',                  'object', 'company')
);
