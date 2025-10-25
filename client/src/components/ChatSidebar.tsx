import { Link, useLocation } from "wouter";
import { X, MessageSquare, LayoutDashboard, BookOpen, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Conversation, Program } from "@shared/schema";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation?: (conversationId: string) => void;
}

export function ChatSidebar({ open, onOpenChange, onSelectConversation }: ChatSidebarProps) {
  const [location] = useLocation();
  const { workspace } = useWorkspace();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/conversations?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs", workspace],
  });

  const recentChats = conversations.slice(0, 5);
  const recentPrograms = programs?.slice(0, 3) || [];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Navigation</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Main Navigation */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Main
                </h3>
                <Link href="/">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      location === "/" && "bg-muted"
                    )}
                    data-testid="sidebar-link-chat"
                  >
                    <MessageSquare className="w-4 h-4 mr-3" />
                    Chat
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      location === "/dashboard" && "bg-muted"
                    )}
                    data-testid="sidebar-link-dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-3" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/programs">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      location === "/programs" && "bg-muted"
                    )}
                    data-testid="sidebar-link-programs"
                  >
                    <BookOpen className="w-4 h-4 mr-3" />
                    Programs
                  </Button>
                </Link>
                <Link href="/achievements">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      location === "/achievements" && "bg-muted"
                    )}
                    data-testid="sidebar-link-achievements"
                  >
                    <Award className="w-4 h-4 mr-3" />
                    Achievements
                  </Button>
                </Link>
              </div>

              {/* Recent Chats */}
              {recentChats.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Recent Chats
                  </h3>
                  <div className="space-y-1">
                    {recentChats.map((conversation, idx) => (
                      <Button
                        key={conversation.id}
                        variant="ghost"
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => {
                          onSelectConversation?.(conversation.id);
                          onOpenChange(false);
                        }}
                        data-testid={`chat-history-${idx}`}
                      >
                        <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0" />
                        <div className="truncate text-left">
                          {conversation.title || "New Chat"}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Programs */}
              {recentPrograms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Recent Programs
                  </h3>
                  <div className="space-y-1">
                    {recentPrograms.map((program) => (
                      <Link key={program.id} href="/programs">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs h-auto py-2"
                          data-testid={`recent-program-${program.id}`}
                        >
                          <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                          <div className="truncate text-left">
                            {program.title}
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
