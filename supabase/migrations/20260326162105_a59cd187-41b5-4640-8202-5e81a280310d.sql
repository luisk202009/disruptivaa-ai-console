CREATE OR REPLACE FUNCTION public.upsert_lead_and_brief(
  _name text,
  _email text,
  _company text,
  _service_type text,
  _answers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _lead_id uuid;
BEGIN
  -- Upsert lead by email
  INSERT INTO leads (name, email, company, service_type, status)
  VALUES (_name, _email, _company, _service_type, 'new')
  ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    company = COALESCE(EXCLUDED.company, leads.company),
    service_type = EXCLUDED.service_type
  RETURNING id INTO _lead_id;

  -- Insert brief submission
  INSERT INTO brief_submissions (lead_id, service_type, answers)
  VALUES (_lead_id, _service_type, _answers);
END;
$$;