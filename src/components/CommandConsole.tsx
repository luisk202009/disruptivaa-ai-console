import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Send, Sparkles, Loader2, User, Bot, X, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useAuth } from "@/contexts/AuthContext";
import { DisruptivaaAgent, DISRUPTIVAA_AGENTS } from "./Dashboard";
import { useOmnichannelMetrics } from "@/hooks/useOmnichannelMetrics";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
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
  const { t } = useTranslation(["common", "agents"]);
  const { user } = useAuth();
  
  const { messages, loading: messagesLoading, saveMessage, addOptimisticMessage, addErrorMessage } = useMessages(chatId);
  const { getConnectedPlatforms } = useIntegrations();
  const { fetchAllMetrics: fetchOmnichannelMetrics } = useOmnichannelMetrics();
  const { alerts: smartAlerts } = useSmartAlerts();

  const handleFilesSelected = (files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
    toast({
      title: t("agents.fileAttached"),
      description: t("agents.fileReadyForAnalysis", { names: files.map(f => f.name).join(', ') }),
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

  // Auto-scroll to bottom when new messages arrive
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
    
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    
    let currentChatId = chatId;
    const isNewConversation = !currentChatId;
    if (!currentChatId) {
      currentChatId = crypto.randomUUID();
      onChatIdGenerated?.(currentChatId);
    }
    
    const fileNamesText = filesToSend.length > 0 
      ? `\n📎 Archivos: ${filesToSend.map(f => f.name).join(', ')}` 
      : '';
    const fullMessageContent = userMessage + fileNamesText;
    
    addOptimisticMessage(fullMessageContent, "user", currentChatId);
    
    if (isNewConversation) {
      const activeProjectId = getActiveProjectId();
      const title = userMessage.length > 50 ? userMessage.substring(0, 50) + "..." : userMessage;
      
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          chat_id: currentChatId,
          title,
          user_id: user.id,
          project_id: activeProjectId,
          agent_id: selectedAgent?.id || null,
        })
        .select()
        .single();

      if (conversationError) {
        console.error("❌ Error creating conversation:", conversationError);
      } else {
        console.log("✅ Conversation created with agent:", conversationData);
        onConversationCreated?.(currentChatId, title, activeProjectId);
      }
    }
    
    saveMessage(fullMessageContent, "user", currentChatId);
    onCommand?.(userMessage);
    
    setIsLoading(true);

    try {
      const connectedPlatforms = getConnectedPlatforms();
      
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token;
      
      if (!userToken) {
        toast({
          title: t("agents.sessionExpired"),
          description: t("agents.sessionExpiredDesc"),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const filesData = await Promise.all(
        filesToSend.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          content: await fileToBase64(file),
        }))
      );
      
      const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0and6ZmJpbnNybW52bHNndnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzY4MDUsImV4cCI6MjA4MTU1MjgwNX0.gvLt5ggffAwHp-HbBAqyGa18HuNZzJ5AHD6p4q6dk7E";
      
    const activeProjectId = getActiveProjectId();

    let omnichannelMetrics = null;
    const isAdsOptimizerAgent = selectedAgent?.id === "ads-optimizer";
    if (connectedPlatforms.length > 0 && isAdsOptimizerAgent) {
      try {
        const omniData = await fetchOmnichannelMetrics();
        const hasAnyPlatform = omniData.platforms.meta || omniData.platforms.google || omniData.platforms.tiktok;
        if (hasAnyPlatform) {
          omnichannelMetrics = {
            platforms: omniData.platforms,
            totalSpend: omniData.consolidated.totalSpend,
            combinedCPA: omniData.consolidated.combinedCPA,
            avgROAS: omniData.consolidated.avgROAS,
            isDemo: omniData.consolidated.allDemo,
          };
        }
      } catch (err) {
        console.warn("Failed to fetch omnichannel metrics:", err);
      }
    }

    const requestBody = {
      message: userMessage,
      agentId: selectedAgent?.id || null,
      agentName: selectedAgent?.name || null,
      systemInstruction: selectedAgent?.systemInstruction || null,
      connectedPlatforms: connectedPlatforms.map(p => p.platform),
      omnichannelMetrics,
      chatId: currentChatId || null,
      projectId: activeProjectId || null,
      files: filesData,
      activeAlerts: isAdsOptimizerAgent && smartAlerts.length > 0
        ? smartAlerts.map(a => ({
            metricKey: a.metricKey,
            level: a.level,
            currentValue: a.currentValue,
            targetValue: a.targetValue,
            deviationPercent: a.deviationPercent,
          }))
        : undefined,
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
            title: t("agents.rateLimitTitle"),
            description: t("agents.rateLimitDesc"),
            variant: "destructive",
          });
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 402) {
          toast({
            title: t("agents.creditsTitle"),
            description: t("agents.creditsDesc"),
            variant: "destructive",
          });
          throw new Error("Payment required");
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Response Data:", data);
      
      if (data.metaConnected) {
        console.log("✅ Meta Ads connected, campaigns analyzed:", data.campaignsCount);
      }
      
    } catch (error) {
      console.error("Error calling agent:", error);
      
      addErrorMessage(t("agents.requestError"));
      
      if (!(error instanceof Error && (error.message.includes("Rate limit") || error.message.includes("Payment")))) {
        toast({
          title: t("common.error"),
          description: t("agents.requestErrorShort"),
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
        case "ads-optimizer":
          return t("agents.suggestions.adsOptimizer", { returnObjects: true }) as string[];
        case "ai-crm-sales":
          return t("agents.suggestions.aiCrmSales", { returnObjects: true }) as string[];
        default:
          return t("agents.suggestions.default", { returnObjects: true }) as string[];
      }
    }
    return DISRUPTIVAA_AGENTS.map(a => t(`${a.id}.name`, { ns: "agents" }));
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
              {t("dashboard.consulting", { name: t(`${selectedAgent.id}.name`, { ns: "agents" }) })}
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
                {t("agents.connectAccount")}
              </Button>
            </div>
          )}

          {messagesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              <span className="ml-2 text-sm text-zinc-500">{t("agents.loadingMessages")}</span>
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
                        {selectedAgent ? t("dashboard.isConsulting", { name: t(`${selectedAgent.id}.name`, { ns: "agents" }) }) : t("common.loading")}
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
                  ? t("agents.loginToChat")
                  : isLoading 
                    ? t("agents.analyzing")
                    : selectedAgent 
                      ? t("agents.writeOrAttach")
                      : t("agents.selectToStart")
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
            {t("agents.loginPrompt")}
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