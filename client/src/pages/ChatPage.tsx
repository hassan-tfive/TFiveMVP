import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/ChatInterface";
import { FloatingTairo } from "@/components/FloatingTairo";
import { ProgramWizard } from "@/components/ProgramWizard";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);

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

  // Determine if Tairo is currently talking (last message is from assistant and recent)
  const lastMessage = messages[messages.length - 1];
  const isTairoTalking = lastMessage?.role === "assistant" && 
    (Date.now() - new Date(lastMessage.createdAt || Date.now()).getTime() < 5000);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-4xl font-display font-bold mb-2">Chat with Tairo</h1>
          <p className="text-lg text-muted-foreground">
            Your personal AI companion for guidance and support
          </p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className={cn(
            "text-white hover:text-white flex-shrink-0",
            workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
          )}
          data-testid="button-create-program"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
      />

      {/* Floating Tairo character */}
      <FloatingTairo 
        isThinking={sendMessageMutation.isPending}
        isTalking={isTairoTalking}
      />

      {/* Program creation wizard */}
      <ProgramWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
