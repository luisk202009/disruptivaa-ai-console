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
import { supabase } from "@/integrations/supabase/client";
import { MarkdownMessage } from "./MarkdownMessage";
import { getActiveProjectId } from "./Sidebar";

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
  onChatIdGenerated?: (chatId: string) => void;
  onConversationCreated?: (chatId: string, title: string, projectId: string | null) => void;
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
  chatId,
  onChatIdGenerated,
  onConversationCreated
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
  
  const { messages, loading: messagesLoading, saveMessage, addOptimisticMessage, addErrorMessage } = useMessages(chatId);
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
    
    // Generate chatId if not provided
    let currentChatId = chatId;
    const isNewConversation = !currentChatId;
    if (!currentChatId) {
      currentChatId = crypto.randomUUID();
      onChatIdGenerated?.(currentChatId);
    }
    
    // Build message content with file names
    const fileNamesText = filesToSend.length > 0 
      ? `\n📎 Archivos: ${filesToSend.map(f => f.name).join(', ')}` 
      : '';
    const fullMessageContent = userMessage + fileNamesText;
    
    // OPTIMISTIC UI: Add user message immediately to local state
    addOptimisticMessage(fullMessageContent, "user", currentChatId);
    
    // Create conversation in DB if this is a new conversation
    if (isNewConversation) {
      const activeProjectId = getActiveProjectId();
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage;
      
      console.log("📝 Creating new conversation:", { 
        chatId: currentChatId, 
        title, 
        userId: user.id, 
        projectId: activeProjectId 
      });
      
      // Create conversation record - Supabase returns { data, error }, not exceptions
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          chat_id: currentChatId,
          title,
          user_id: user.id,
          project_id: activeProjectId,
        })
        .select()
        .single();

      if (conversationError) {
        console.error("❌ Error creating conversation:", conversationError);
      } else {
        console.log("✅ Conversation created:", conversationData);
        onConversationCreated?.(currentChatId, title, activeProjectId);
      }
    }
    
    // Save user message to Supabase with chat_id (async, in background)
    saveMessage(fullMessageContent, "user", currentChatId);
    
    // Notify parent if callback provided
    onCommand?.(userMessage);
    
    setIsLoading(true);

    try {
      const connectedPlatforms = getConnectedPlatforms();
      
      // Get the user's JWT token for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;
      
      if (!userToken) {
        toast({
          title: "Sesión expirada",
          description: "Por favor inicia sesión de nuevo.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
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
      
    // Get project ID for goals context
    const activeProjectId = getActiveProjectId();

    const requestBody = {
      message: userMessage,
      agentId: selectedAgent?.id || null,
      agentName: selectedAgent?.name || null,
      systemInstruction: selectedAgent?.systemInstruction || null,
      connectedPlatforms: connectedPlatforms.map(p => p.platform),
      chatId: currentChatId || null,
      projectId: activeProjectId || null,
      files: filesData,
    };
      
      console.log("📤 Request Body:", { ...requestBody, files: filesData.map(f => ({ name: f.name, size: f.size })) });
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${userToken}`,
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
      
      // Add error message to chat UI (visible in conversation)
      addErrorMessage("❌ Hubo un error al procesar tu solicitud. Por favor intenta de nuevo o revisa tu conexión.");
      
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700">
            <selectedAgent.icon size={16} className="text-zinc-300" />
            <span className="text-sm font-medium text-zinc-300">
              Consultando a {selectedAgent.name}
            </span>
            <button 
              onClick={onClearAgent}
              className="ml-1 p-1 rounded-full hover:bg-zinc-700 transition-colors"
            >
              <X size={14} className="text-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {showMessages && (messages.length > 0 || messagesLoading || isAdsOptimizer) && (
        <div 
          ref={messagesContainerRef}
          className={cn(
            "mb-4 overflow-y-auto space-y-6 py-4",
            fullHeight ? "flex-1 min-h-0" : "max-h-80"
          )}
        >
          {/* Connect Ads Account button inside chat area */}
          {isAdsOptimizer && (
            <div className="flex justify-center pb-2 border-b border-zinc-800/50 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectAccount}
                className="text-xs border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
              >
                <Link2 size={14} className="mr-1.5" />
                Conectar cuenta de Meta/Google
              </Button>
            </div>
          )}

          {messagesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <span className="ml-2 text-sm text-zinc-500">Cargando mensajes...</span>
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
                      ? "bg-zinc-700 text-zinc-200" 
                      : "bg-zinc-800 text-zinc-400"
                  )}>
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={cn(
                      "rounded-xl text-base",
                      msg.role === "user"
                        ? "bg-white/[0.06] text-white px-4 py-3 max-w-[80%]"
                        : "text-zinc-400 max-w-4xl w-full"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownMessage content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-zinc-400" />
                      <span className="text-sm text-zinc-500">
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
            "relative rounded-xl transition-all duration-200 bg-zinc-900/50 border",
            !isAuthenticated 
              ? "border-zinc-800 cursor-not-allowed opacity-75" 
              : isFocused 
                ? "border-zinc-600 shadow-lg shadow-black/20" 
                : "border-zinc-800"
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

            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800">
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
              ) : selectedAgent ? (
                <selectedAgent.icon className="w-5 h-5 text-zinc-400" />
              ) : (
                <Sparkles className="w-5 h-5 text-zinc-400" />
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
            className="px-4 py-2 text-sm rounded-full bg-zinc-900/30 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommandConsole;
