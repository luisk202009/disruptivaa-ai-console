-- Add "tiktok_ads" to the allowed data_source values
ALTER TABLE widgets DROP CONSTRAINT widgets_data_source_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_data_source_check CHECK (data_source = ANY (ARRAY['meta_ads'::text, 'google_ads'::text, 'manual'::text, 'tiktok_ads'::text]));

-- Update existing TikTok widgets from "manual" to "tiktok_ads"
UPDATE widgets SET data_source = 'tiktok_ads' WHERE data_source = 'manual';