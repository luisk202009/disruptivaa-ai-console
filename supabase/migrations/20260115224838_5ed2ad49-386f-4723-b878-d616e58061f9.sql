-- Create dashboards table
CREATE TABLE public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout_config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for dashboards
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboards
CREATE POLICY "Users can view their own dashboards"
  ON public.dashboards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboards"
  ON public.dashboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards"
  ON public.dashboards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards"
  ON public.dashboards FOR DELETE
  USING (auth.uid() = user_id);

-- Create widgets table
CREATE TABLE public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('kpi', 'line', 'bar', 'pie', 'table', 'area')),
  title TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('meta_ads', 'google_ads', 'manual')),
  metric_config JSONB NOT NULL DEFAULT '{}',
  grid_settings JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 3}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for widgets
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for widgets (via dashboard ownership)
CREATE POLICY "Users can view widgets on their dashboards"
  ON public.widgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = widgets.dashboard_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create widgets on their dashboards"
  ON public.widgets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = widgets.dashboard_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update widgets on their dashboards"
  ON public.widgets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = widgets.dashboard_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete widgets on their dashboards"
  ON public.widgets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = widgets.dashboard_id AND d.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widgets_updated_at
  BEFORE UPDATE ON public.widgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.widgets;