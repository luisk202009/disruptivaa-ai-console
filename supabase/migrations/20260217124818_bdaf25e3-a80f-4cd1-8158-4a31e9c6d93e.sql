
CREATE OR REPLACE FUNCTION public.create_company_for_user(
  _company_name text,
  _branding_color text DEFAULT '#00A3FF'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _company_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = _user_id AND company_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already has a company assigned';
  END IF;

  INSERT INTO companies (name, branding_color)
  VALUES (_company_name, _branding_color)
  RETURNING id INTO _company_id;

  UPDATE profiles
  SET company_id = _company_id, updated_at = now()
  WHERE id = _user_id;

  RETURN _company_id;
END;
$$;
