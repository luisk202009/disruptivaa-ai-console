-- Add columns for storing user-specific Meta credentials
ALTER TABLE public.user_integrations 
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meta_app_id TEXT,
ADD COLUMN IF NOT EXISTS account_ids TEXT[];