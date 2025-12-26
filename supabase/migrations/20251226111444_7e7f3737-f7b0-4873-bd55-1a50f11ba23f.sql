-- Enable RLS on ai_agents table
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Create read-only policy for authenticated users on ai_agents
CREATE POLICY "Authenticated users can view agents"
ON public.ai_agents
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on ai_agent_logs table
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Create read-only policy for authenticated users on ai_agent_logs
CREATE POLICY "Authenticated users can view logs"
ON public.ai_agent_logs
FOR SELECT
TO authenticated
USING (true);

-- Enable RLS on ai_tools table
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

-- Create read-only policy for authenticated users on ai_tools
CREATE POLICY "Authenticated users can view tools"
ON public.ai_tools
FOR SELECT
TO authenticated
USING (true);