import { useQuery, useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/ChatInterface";
import { FloatingTairo } from "@/components/FloatingTairo";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import tairoLogoDark from "@assets/5_1761655395321.png";
import tairoLogoLight from "@assets/4_1761655395321.png";

export default function ChatPage() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/chat?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/chat", { content, workspace });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", workspace] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate(content);
  };

  // Determine if tairo is currently talking (last message is from assistant and recent)
  const lastMessage = messages[messages.length - 1];
  const isTairoTalking = lastMessage?.role === "assistant" && 
    (Date.now() - new Date(lastMessage.createdAt || Date.now()).getTime() < 5000);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <div className="flex flex-col items-center text-center">
        <img 
          src={tairoLogoLight}
          alt="tairo"
          className="h-16 mb-4 hidden dark:block"
          data-testid="img-tairo-logo"
        />
        <img 
          src={tairoLogoDark}
          alt="tairo"
          className="h-16 mb-4 block dark:hidden"
          data-testid="img-tairo-logo"
        />
        <p className="text-lg text-muted-foreground">
          Your personal AI companion for guidance and support
        </p>
      </div>

      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
      />

      {/* Floating tairo character */}
      <FloatingTairo 
        isThinking={sendMessageMutation.isPending}
        isTalking={isTairoTalking}
      />
    </div>
  );
}
