import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Loader2, LayoutDashboard, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ChatLayout } from "@/components/AppLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import type { ChatMessage, Program } from "@shared/schema";

export default function ChatHome() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [location] = useLocation();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousLocationRef = useRef<string>("");
  const previousWorkspaceRef = useRef<string>(workspace);

  // Track current conversation messages and ID
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/programs?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat", { 
        content, 
        workspace,
        conversationId // Send current conversation ID
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      // Update conversation ID if this was a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Replace optimistic messages with real ones from server
      if (data.userMessage && data.assistantMessage) {
        setMessages(prev => {
          // Remove the last message (optimistic user message)
          const withoutOptimistic = prev.slice(0, -1);
          // Add both real messages
          return [...withoutOptimistic, data.userMessage, data.assistantMessage];
        });
      }
      // Invalidate conversations list in sidebar
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", workspace] });
    },
    onError: () => {
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // New Chat handler
  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  // Load a specific conversation
  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${convId}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const conversationMessages = await res.json();
      setMessages(conversationMessages);
      setConversationId(convId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  // Reset messages when entering ChatHome from another page or workspace changes
  useEffect(() => {
    const isEnteringChat = previousLocationRef.current !== "" && previousLocationRef.current !== "/" && location === "/";
    const isWorkspaceChange = previousWorkspaceRef.current !== workspace;
    const isFirstMount = previousLocationRef.current === "";
    
    if (isFirstMount || isEnteringChat || isWorkspaceChange) {
      setMessages([]);
      setConversationId(null);
    }
    
    previousLocationRef.current = location;
    previousWorkspaceRef.current = workspace;
  }, [location, workspace]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !sendMessageMutation.isPending) {
      const userInput = input.trim();
      
      // Optimistically add user message to UI
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        userId: '',
        role: 'user',
        content: userInput,
        workspace,
        conversationId: null,
        metadata: null,
        createdAt: new Date()
      } as ChatMessage]);
      
      setInput("");
      sendMessageMutation.mutate(userInput);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const recommendedPrograms = programs.slice(0, 3);
  const hasMessages = messages.length > 0;

  return (
    <ChatLayout showTairoTitle onSelectConversation={loadConversation} onNewChat={startNewChat}>
      <div className="flex flex-col h-full">
        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
                <div className="text-center space-y-3">
                  <h1 className="text-4xl font-display font-bold">Hi! How are you?</h1>
                  <p className="text-muted-foreground text-lg">
                    I'm tairo, your AI companion for personal growth. How can I help you today?
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start hover-elevate"
                    onClick={() => setInput("Help me improve my focus and productivity")}
                    data-testid="button-prompt-focus"
                  >
                    <div>
                      <div className="font-medium mb-1">Improve Focus</div>
                      <div className="text-xs text-muted-foreground">Help me be more productive</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start hover-elevate"
                    onClick={() => setInput("I want to develop better leadership skills")}
                    data-testid="button-prompt-leadership"
                  >
                    <div>
                      <div className="font-medium mb-1">Build Leadership</div>
                      <div className="text-xs text-muted-foreground">Develop my leadership abilities</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start hover-elevate"
                    onClick={() => setInput("I need help managing stress and staying calm")}
                    data-testid="button-prompt-stress"
                  >
                    <div>
                      <div className="font-medium mb-1">Manage Stress</div>
                      <div className="text-xs text-muted-foreground">Learn stress management techniques</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start hover-elevate"
                    onClick={() => setInput("Show me programs for personal wellbeing")}
                    data-testid="button-prompt-wellbeing"
                  >
                    <div>
                      <div className="font-medium mb-1">Enhance Wellbeing</div>
                      <div className="text-xs text-muted-foreground">Improve my overall wellness</div>
                    </div>
                  </Button>
                </div>

              </div>
            ) : (
              <div className="space-y-4" data-testid="chat-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                    data-testid={`message-${message.role}`}
                  >
                    {message.role === "user" ? (
                      <div
                        className={cn(
                          "max-w-[75%] rounded-lg px-4 py-3",
                          workspace === "professional"
                            ? "bg-workspace-professional text-white"
                            : "bg-workspace-personal text-white"
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[75%] py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-muted-foreground">tairo</span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{message.content}</p>
                      </div>
                    )}
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start gap-3">
                    <div className="py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">tairo is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Invisible element for scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t flex-shrink-0">
          <div className="max-w-3xl mx-auto px-6 py-4 space-y-3">
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-testid="button-quick-dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-testid="button-quick-programs"
              >
                <Link href="/programs">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Programs
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                data-testid="button-quick-achievements"
              >
                <Link href="/achievements">
                  <Award className="w-4 h-4 mr-2" />
                  Achievements
                </Link>
              </Button>
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="How can I help you today?"
                className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px] max-h-[200px]"
                data-testid="input-chat"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
                size="icon"
                className={cn(
                  "h-[60px] w-[60px] text-white hover:text-white",
                  workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
                )}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
