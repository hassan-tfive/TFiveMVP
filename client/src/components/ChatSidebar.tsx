import { Link, useLocation } from "wouter";
import { X, MessageSquare, LayoutDashboard, BookOpen, Award, Clock, Plus, UserCircle, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Conversation, Program, User } from "@shared/schema";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import logoLight from "@assets/v3 - crimson text font-06_1761388223780.png";
import logoDark from "@assets/v3 - crimson text font-08_1761388214633.png";

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation?: (conversationId: string) => void;
  onNewChat?: () => void;
}

export function ChatSidebar({ open, onOpenChange, onSelectConversation, onNewChat }: ChatSidebarProps) {
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
    queryFn: async () => {
      const res = await fetch(`/api/programs?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  const recentChats = conversations.slice(0, 5);
  const recentPrograms = programs?.slice(0, 3) || [];

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await fetch("/api/logout");
    window.location.href = "/login";
  };

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
            <div className="flex items-center">
              <img 
                src={logoDark} 
                alt="Tfive" 
                className="h-8 w-auto dark:hidden"
              />
              <img 
                src={logoLight} 
                alt="Tfive" 
                className="h-8 w-auto hidden dark:block"
              />
            </div>
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
            <div className="p-4 space-y-6 max-w-full overflow-hidden">
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
              <div className="space-y-2 max-w-full overflow-hidden">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Chats
                  </h3>
                  {location === "/" && onNewChat && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        onNewChat();
                        onOpenChange(false);
                      }}
                      data-testid="button-new-chat"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      New
                    </Button>
                  )}
                </div>
                {recentChats.length > 0 && (
                  <div className="space-y-1 max-w-full overflow-hidden">
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
                        <span className="truncate min-w-0 flex-1">
                          {conversation.title || "New Chat"}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Programs */}
              {recentPrograms.length > 0 && (
                <div className="space-y-2 max-w-full overflow-hidden">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Recent Programs
                  </h3>
                  <div className="space-y-1 max-w-full overflow-hidden">
                    {recentPrograms.map((program) => (
                      <Link key={program.id} href="/programs" className="block max-w-full">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs h-auto py-2"
                          data-testid={`recent-program-${program.id}`}
                        >
                          <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span className="truncate min-w-0 flex-1">
                            {program.title}
                          </span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer - Profile Menu */}
          {user && (
            <div className="border-t p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 hover-elevate"
                    data-testid="button-profile-menu"
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                      <p className="text-sm font-medium truncate w-full text-left">{user.username}</p>
                      <p className="text-xs text-muted-foreground text-left">Level {user.level} • {user.points} pts</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t">
                        <div className="text-xs">
                          <span className="font-semibold">Level {user.level}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.points} points
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
