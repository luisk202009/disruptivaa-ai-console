
-- Create metrics_cache table for backend caching of API responses
CREATE TABLE public.metrics_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  cache_key text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE(user_id, cache_key)
);

-- Enable RLS
ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies (Edge Functions use service_role_key, but policies for safety)
CREATE POLICY "Users can view their own cache"
ON public.metrics_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cache"
ON public.metrics_cache FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cache"
ON public.metrics_cache FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cache"
ON public.metrics_cache FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_metrics_cache_lookup ON public.metrics_cache (user_id, cache_key, expires_at);

-- Auto-cleanup of expired cache entries (optional trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.metrics_cache WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_expired_cache
AFTER INSERT ON public.metrics_cache
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_cache();
