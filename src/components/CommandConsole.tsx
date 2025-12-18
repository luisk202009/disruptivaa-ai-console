import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Loader2, User, Bot, X, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { DisruptivaaAgent, DISRUPTIVAA_AGENTS } from "./Dashboard";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";

interface CommandConsoleProps {
  onCommand?: (command: string) => void;
  userId?: string;
  selectedAgent?: DisruptivaaAgent | null;
  onClearAgent?: () => void;
}

const EDGE_FUNCTION_URL = "https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/disruptivaa-agent";

const CommandConsole = ({ 
  onCommand, 
  userId = "anonymous",
  selectedAgent,
  onClearAgent 
}: CommandConsoleProps) => {
  const [command, setCommand] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading: messagesLoading, saveMessage } = useMessages();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConnectAccount = () => {
    toast({
      title: "Conectar cuenta publicitaria",
      description: "Próximamente podrás conectar tus cuentas de Meta y Google Ads.",
    });
  };

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

    // Determinar prioridad de conocimiento según el agente
    const getKnowledgePriority = () => {
      if (!selectedAgent) return { documents: ["all"], priority: "general" };
      switch (selectedAgent.id) {
        case "smart-brand-architect":
          return { documents: ["Manual_de_Marca_Disruptivaa.pdf"], priority: "brand_identity" };
        case "ghostwriter-pro":
          return { documents: ["Portafolio_Disruptivaa.pdf", "Servicios_Disruptivaa.pdf"], priority: "content_pricing" };
        case "ads-optimizer":
          return { documents: ["Portafolio_Disruptivaa.pdf"], priority: "campaigns_budget" };
        case "ai-crm-sales":
          return { documents: ["Servicios_Disruptivaa.pdf", "Portafolio_Disruptivaa.pdf"], priority: "sales_leads" };
        case "visual-content-bot":
          return { documents: ["Manual_de_Marca_Disruptivaa.pdf", "Portafolio_Disruptivaa.pdf"], priority: "visual_design" };
        default:
          return { documents: ["all"], priority: "general" };
      }
    };

    try {
      const knowledgePriority = getKnowledgePriority();
      
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0and6ZmJpbnNybW52bHNndnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzY4MDUsImV4cCI6MjA4MTU1MjgwNX0.gvLt5ggffAwHp-HbBAqyGa18HuNZzJ5AHD6p4q6dk7E";
      
      const requestBody = {
        message: userMessage,
        userId: userId,
        agentId: selectedAgent?.id || null,
        agentName: selectedAgent?.name || null,
        systemInstruction: selectedAgent?.systemInstruction || null,
        useKnowledgeBase: true,
        knowledgePriority: knowledgePriority,
      };
      
      console.log("🔑 Supabase Anon Key:", supabaseAnonKey.substring(0, 50) + "...");
      console.log("📤 Request URL:", EDGE_FUNCTION_URL);
      console.log("📤 Request Body:", requestBody);
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("📥 Response Status:", response.status, response.statusText);

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

  // Suggestions based on selected agent
  const getSuggestions = () => {
    if (selectedAgent) {
      switch (selectedAgent.id) {
        case "smart-brand-architect":
          return ["Crear identidad visual", "Generar paleta de colores", "Diseñar logo"];
        case "ghostwriter-pro":
          return ["Escribir artículo de blog", "Crear copy para redes", "Generar newsletter"];
        case "ads-optimizer":
          return ["Optimizar campaña Meta", "Analizar rendimiento Ads", "Sugerir presupuesto"];
        case "ai-crm-sales":
          return ["Calificar nuevos leads", "Crear secuencia de emails", "Analizar pipeline"];
        case "visual-content-bot":
          return ["Crear banner para Instagram", "Diseñar post para LinkedIn", "Generar carrusel"];
        default:
          return ["¿Cómo puedes ayudarme?"];
      }
    }
    return DISRUPTIVAA_AGENTS.map(a => a.name);
  };

  const suggestions = getSuggestions();

  const isAdsOptimizer = selectedAgent?.id === "ads-optimizer";

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Agent Context Badge */}
      {selectedAgent && (
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <selectedAgent.icon size={16} className="text-primary" />
            <span className="text-sm font-medium text-primary">
              Consultando a {selectedAgent.name}
            </span>
            <button 
              onClick={onClearAgent}
              className="ml-1 p-1 rounded-full hover:bg-primary/20 transition-colors"
            >
              <X size={14} className="text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {(messages.length > 0 || messagesLoading || isAdsOptimizer) && (
        <div className="mb-4 max-h-80 overflow-y-auto space-y-3 p-4 glass rounded-2xl">
          {/* Connect Ads Account button inside chat area */}
          {isAdsOptimizer && (
            <div className="flex justify-center pb-2 border-b border-border/30 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectAccount}
                className="text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <Link2 size={14} className="mr-1.5" />
                Conectar cuenta de Meta/Google
              </Button>
            </div>
          )}

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
                      <span className="text-sm text-muted-foreground">
                        {selectedAgent ? `${selectedAgent.name} está consultando...` : "Procesando..."}
                      </span>
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
              ) : selectedAgent ? (
                <selectedAgent.icon className="w-5 h-5 text-primary" />
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
              placeholder={
                isLoading 
                  ? "Procesando..." 
                  : selectedAgent 
                    ? `Escribe a ${selectedAgent.name}...` 
                    : "Selecciona un agente para comenzar..."
              }
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
