-- Create project_goals table
CREATE TABLE public.project_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(project_id, metric_key)
);

-- Index for fast lookups
CREATE INDEX idx_project_goals_project_id ON project_goals(project_id);

-- Trigger for updated_at
CREATE TRIGGER update_project_goals_updated_at
  BEFORE UPDATE ON project_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE project_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view goals of their projects"
  ON project_goals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_goals.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create goals for their projects"
  ON project_goals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_goals.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update goals of their projects"
  ON project_goals FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_goals.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete goals of their projects"
  ON project_goals FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_goals.project_id AND p.user_id = auth.uid()
  ));