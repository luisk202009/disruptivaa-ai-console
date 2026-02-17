
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins have full access to notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users: SELECT global or own company notifications
CREATE POLICY "Users can view relevant notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  company_id IS NULL
  OR company_id IN (
    SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()
  )
);

-- Security definer function for marking as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET read_by = array_append(read_by, auth.uid())
  WHERE id = _notification_id
    AND NOT (read_by @> ARRAY[auth.uid()]);
END;
$$;
