import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage } from "@shared/schema";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { workspace } = useWorkspace();
  const { toast } = useToast();

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert audio to text using Web Speech API or send to backend
        // For now, show a toast that voice input was recorded
        toast({
          title: "Voice recorded",
          description: "Voice transcription feature coming soon. Please type your message for now.",
        });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className={cn(
        "flex items-center gap-4 p-6 border-b",
        workspace === "professional" ? "bg-workspace-professional-bg" : "bg-workspace-personal-bg"
      )}>
        <div>
          <h3 className="text-xl font-semibold">tairo - Your AI Companion</h3>
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
                      <span className="text-xs font-semibold text-muted-foreground">tairo</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start gap-3">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">tairo is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2 items-end justify-center max-w-3xl mx-auto w-full">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts with tairo..."
            className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
            data-testid="input-chat"
            disabled={isLoading || isRecording}
          />
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            data-testid="button-voice-input"
            className={cn(
              "min-h-[60px]",
              isRecording && "animate-pulse"
            )}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            data-testid="button-send-message"
            size="icon"
            className={cn(
              "text-white hover:text-white min-h-[60px]",
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
