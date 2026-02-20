-- Enable RLS on companies table (policies already exist but aren't enforced)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;