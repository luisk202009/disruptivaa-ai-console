-- Habilitar Realtime para la tabla conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Migrar conversaciones históricas desde agent_messages
INSERT INTO public.conversations (chat_id, title, user_id, project_id, created_at, updated_at)
SELECT DISTINCT ON (am.chat_id)
  am.chat_id,
  LEFT(am.content, 50) || CASE WHEN LENGTH(am.content) > 50 THEN '...' ELSE '' END as title,
  am.user_id,
  NULL as project_id,
  am.created_at,
  am.created_at as updated_at
FROM public.agent_messages am
WHERE am.chat_id IS NOT NULL
  AND am.user_id IS NOT NULL
  AND am.role = 'user'
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.chat_id = am.chat_id
  )
ORDER BY am.chat_id, am.created_at ASC;