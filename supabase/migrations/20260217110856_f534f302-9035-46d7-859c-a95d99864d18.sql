
-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function to check roles (bypasses RLS, no recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policies for user_roles: only admins can manage, users can read their own
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Migrate existing admin users from profiles.role to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- 7. Update companies RLS to use has_role() instead of profiles.role
DROP POLICY IF EXISTS "Admins have full access to companies" ON public.companies;
CREATE POLICY "Admins have full access to companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Update company_websites RLS to use has_role()
DROP POLICY IF EXISTS "Admins can manage all websites" ON public.company_websites;
CREATE POLICY "Admins can manage all websites"
ON public.company_websites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
