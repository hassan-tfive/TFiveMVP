import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { TairoAvatar } from "@/components/TairoAvatar";
import type { ChatMessage } from "@shared/schema";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { workspace } = useWorkspace();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className={cn(
        "flex items-center gap-4 p-6 border-b",
        workspace === "professional" ? "bg-workspace-professional-bg" : "bg-workspace-personal-bg"
      )}>
        <TairoAvatar size="xl" isThinking={isLoading} isTalking={false} />
        <div>
          <h3 className="text-xl font-semibold">Tairo - Your AI Companion</h3>
          <p className="text-sm text-muted-foreground">
            {workspace === "professional" ? "Professional Workspace" : "Personal Workspace"}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4" data-testid="chat-messages">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Welcome to Tfive!</p>
              <p className="text-sm">How are you feeling today? What would you like to focus on?</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
                data-testid={`message-${message.role}`}
              >
                {message.role === "assistant" && (
                  <TairoAvatar size="md" className="mt-1 flex-shrink-0" isTalking={true} />
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-4 py-3",
                    message.role === "user"
                      ? workspace === "professional"
                        ? "bg-workspace-professional text-white"
                        : "bg-workspace-personal text-white"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Tairo</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start gap-3">
              <TairoAvatar size="md" isThinking={true} className="flex-shrink-0" />
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Tairo is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts with Tairo..."
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
            data-testid="input-chat"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            data-testid="button-send-message"
            className={cn(
              "text-white hover:text-white",
              workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
            )}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
