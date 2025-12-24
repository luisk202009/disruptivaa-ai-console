-- Add chat_id column to agent_messages for conversation threading
ALTER TABLE public.agent_messages 
ADD COLUMN chat_id UUID DEFAULT gen_random_uuid();

-- Create indexes for efficient queries
CREATE INDEX idx_agent_messages_chat_id ON public.agent_messages(chat_id);
CREATE INDEX idx_agent_messages_user_chat ON public.agent_messages(user_id, chat_id);

-- Update existing messages: group by user_id and assign same chat_id per user (single conversation per user for existing data)
UPDATE public.agent_messages 
SET chat_id = gen_random_uuid() 
WHERE chat_id IS NULL;