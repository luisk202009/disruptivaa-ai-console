import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Loader2, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages, Message } from "@/hooks/useMessages";

interface CommandConsoleProps {
  onCommand?: (command: string) => void;
  userId?: string;
}

const EDGE_FUNCTION_URL = "https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/disruptivaa-agent";

const CommandConsole = ({ onCommand, userId = "anonymous" }: CommandConsoleProps) => {
  const [command, setCommand] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading: messagesLoading, saveMessage } = useMessages();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    const userMessage = command.trim();
    setCommand("");
    
    // Save user message to Supabase
    await saveMessage(userMessage, "user");
    
    // Notify parent if callback provided
    onCommand?.(userMessage);
    
    setIsLoading(true);

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const agentResponse = data.response || data.message || "Respuesta recibida del agente.";
      
      // Save agent response to Supabase (will appear via realtime subscription)
      await saveMessage(agentResponse, "assistant");
    } catch (error) {
      console.error("Error calling agent:", error);
      // Save error message
      await saveMessage("Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.", "assistant");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Auditar sitio web",
    "Generar presupuesto",
    "Desplegar cambios",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Chat Messages */}
      {(messages.length > 0 || messagesLoading) && (
        <div className="mb-4 max-h-80 overflow-y-auto space-y-3 p-4 glass rounded-2xl">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando mensajes...</span>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border text-foreground rounded-tl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative rounded-2xl transition-all duration-300 bg-card border-2",
            isFocused ? "border-primary shadow-[0_0_20px_rgba(239,121,17,0.3)]" : "border-border"
          )}
        >
          <div className="flex items-center gap-3 p-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
            </div>
            
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isLoading ? "Procesando..." : "Escribe un comando para los agentes AI..."}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            <button
              type="submit"
              disabled={!command.trim() || isLoading}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                command.trim() && !isLoading
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-primary" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => !isLoading && setCommand(suggestion)}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-full glass border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommandConsole;
