-- Habilitar RLS en agent_messages
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios solo ven sus mensajes
CREATE POLICY "Users can view their own messages"
ON agent_messages FOR SELECT
USING (auth.uid() = user_id);

-- Política para INSERT: usuarios solo crean mensajes propios
CREATE POLICY "Users can insert their own messages"
ON agent_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: usuarios solo eliminan sus mensajes
CREATE POLICY "Users can delete their own messages"
ON agent_messages FOR DELETE
USING (auth.uid() = user_id);

-- Habilitar realtime con filtro por usuario
ALTER TABLE agent_messages REPLICA IDENTITY FULL;