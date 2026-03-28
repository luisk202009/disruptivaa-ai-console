
-- Add description and instructions columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS instructions text;

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their project files"
  ON project_files FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload project files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own project files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
