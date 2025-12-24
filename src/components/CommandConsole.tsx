import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Send, Sparkles, Loader2, User, Bot, X, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useAuth } from "@/contexts/AuthContext";
import { DisruptivaaAgent, DISRUPTIVAA_AGENTS } from "./Dashboard";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import FileUploadButton from "./FileUploadButton";

interface CommandConsoleProps {
  onCommand?: (command: string) => void;
  selectedAgent?: DisruptivaaAgent | null;
  onClearAgent?: () => void;
  onAuthRequired?: () => boolean;
  isAuthenticated?: boolean;
  autoFocus?: boolean;
  showMessages?: boolean;
  fullHeight?: boolean;
  chatId?: string | null;
}

const EDGE_FUNCTION_URL = "https://qtjwzfbinsrmnvlsgvtw.supabase.co/functions/v1/disruptivaa-agent";

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

const CommandConsole = ({ 
  onCommand, 
  selectedAgent,
  onClearAgent,
  onAuthRequired,
  isAuthenticated = true,
  autoFocus = false,
  showMessages = true,
  fullHeight = false,
  chatId
}: CommandConsoleProps) => {
  const [command, setCommand] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { messages, loading: messagesLoading, saveMessage } = useMessages(chatId);
  const { getConnectedPlatforms } = useIntegrations();

  const handleFilesSelected = (files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
    toast({
      title: "Archivo adjuntado",
      description: `${files.map(f => f.name).join(', ')} listo para análisis`,
    });
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && isAuthenticated && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, isAuthenticated]);

  // Auto-scroll to bottom when new messages arrive - using useLayoutEffect for immediate scroll
  useLayoutEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleConnectAccount = () => {
    navigate("/connections");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading || !user) return;

    const userMessage = command.trim();
    setCommand("");
    
    // Capture files before clearing
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    
    // Save user message to Supabase with chat_id
    const fileNames = filesToSend.length > 0 
      ? `\n📎 Archivos: ${filesToSend.map(f => f.name).join(', ')}` 
      : '';
    await saveMessage(userMessage + fileNames, "user", chatId || undefined);
    
    // Notify parent if callback provided
    onCommand?.(userMessage);
    
    setIsLoading(true);

    try {
      const connectedPlatforms = getConnectedPlatforms();
      
      // Convert attached files to base64
      const filesData = await Promise.all(
        filesToSend.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          content: await fileToBase64(file),
        }))
      );
      
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0and6ZmJpbnNybW52bHNndnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzY4MDUsImV4cCI6MjA4MTU1MjgwNX0.gvLt5ggffAwHp-HbBAqyGa18HuNZzJ5AHD6p4q6dk7E";
      
      const requestBody = {
        message: userMessage,
        userId: user.id,
        agentId: selectedAgent?.id || null,
        agentName: selectedAgent?.name || null,
        systemInstruction: selectedAgent?.systemInstruction || null,
        connectedPlatforms: connectedPlatforms.map(p => p.platform),
        chatId: chatId || null,
        files: filesData,
      };
      
      console.log("📤 Request Body:", { ...requestBody, files: filesData.map(f => ({ name: f.name, size: f.size })) });
      
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
        if (response.status === 429) {
          toast({
            title: "Límite de velocidad excedido",
            description: "Por favor espera un momento e intenta de nuevo.",
            variant: "destructive",
          });
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 402) {
          toast({
            title: "Créditos agotados",
            description: "Por favor agrega créditos a tu workspace.",
            variant: "destructive",
          });
          throw new Error("Payment required");
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Response Data:", data);
      
      // The edge function now saves the message directly, but we can use realtime to update
      // If metaConnected info is returned, we could use it for UI updates
      if (data.metaConnected) {
        console.log("✅ Meta Ads connected, campaigns analyzed:", data.campaignsCount);
      }
      
    } catch (error) {
      console.error("Error calling agent:", error);
      if (!(error instanceof Error && (error.message.includes("Rate limit") || error.message.includes("Payment")))) {
        toast({
          title: "Error",
          description: "Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.",
          variant: "destructive",
        });
      }
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
    <div className={cn("w-full mx-auto", fullHeight ? "h-full flex flex-col max-w-4xl" : "max-w-3xl")}>
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
      {showMessages && (messages.length > 0 || messagesLoading || isAdsOptimizer) && (
        <div 
          ref={messagesContainerRef}
          className={cn(
            "mb-4 overflow-y-auto space-y-3 p-4 glass rounded-2xl",
            fullHeight ? "flex-1 min-h-0" : "max-h-80"
          )}
        >
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
                        : "bg-zinc-800 border-2 border-[#EF7911] text-foreground rounded-tl-sm"
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
                  <div className="bg-zinc-800 border-2 border-[#EF7911] px-4 py-3 rounded-2xl rounded-tl-sm">
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
            !isAuthenticated 
              ? "border-muted cursor-not-allowed opacity-75" 
              : isFocused 
                ? "border-primary shadow-[0_0_20px_rgba(239,121,17,0.3)]" 
                : "border-border"
          )}
        >
        {/* File previews above input */}
          {attachedFiles.length > 0 && (
            <div className="px-3 pt-2 pb-1 border-b border-border/30">
              <FileUploadButton
                onFilesSelected={handleFilesSelected}
                attachedFiles={attachedFiles}
                onRemoveFile={handleRemoveFile}
                disabled={isLoading || !isAuthenticated}
              />
            </div>
          )}

          <div className="flex items-center gap-2 p-2">
            {/* File upload button */}
            {attachedFiles.length === 0 && (
              <FileUploadButton
                onFilesSelected={handleFilesSelected}
                attachedFiles={attachedFiles}
                onRemoveFile={handleRemoveFile}
                disabled={isLoading || !isAuthenticated}
              />
            )}

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
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onFocus={() => {
                if (!isAuthenticated) {
                  onAuthRequired?.();
                  return;
                }
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
              placeholder={
                !isAuthenticated
                  ? "Inicia sesión para chatear"
                  : isLoading 
                    ? "Analizando..." 
                    : selectedAgent 
                      ? `Escribe o adjunta archivos para análisis...` 
                      : "Selecciona un agente para comenzar..."
              }
              disabled={isLoading || !isAuthenticated}
              className={cn(
                "flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base py-2",
                !isAuthenticated 
                  ? "cursor-not-allowed" 
                  : "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            
            <button
              type="submit"
              disabled={(!command.trim() && attachedFiles.length === 0) || isLoading || !isAuthenticated}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                (command.trim() || attachedFiles.length > 0) && !isLoading && isAuthenticated
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
        
        {/* Login prompt for unauthenticated users */}
        {!isAuthenticated && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            🔒 Inicia sesión para interactuar con nuestros agentes AI
          </p>
        )}
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
