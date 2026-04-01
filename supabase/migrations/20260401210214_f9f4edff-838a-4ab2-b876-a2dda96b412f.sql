-- Add RLS policies for the knowledge-base storage bucket
-- Only authenticated users can upload/read files, scoped to their own folder

CREATE POLICY "Authenticated users can read their own knowledge-base files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'knowledge-base' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can upload to their own knowledge-base folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'knowledge-base' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can update their own knowledge-base files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'knowledge-base' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can delete their own knowledge-base files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'knowledge-base' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can access all knowledge-base files
CREATE POLICY "Admins can manage all knowledge-base files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'knowledge-base' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'knowledge-base' AND public.has_role(auth.uid(), 'admin'));