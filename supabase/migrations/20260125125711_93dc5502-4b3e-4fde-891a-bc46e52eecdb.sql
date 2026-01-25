-- Add agent_id column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);

-- Comment for documentation
COMMENT ON COLUMN public.conversations.agent_id IS 
  'Reference to the AI agent used for this conversation';