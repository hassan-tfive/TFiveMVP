import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ProfileMenu } from "@/components/ProfileMenu";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

interface ChatLayoutProps {
  children: React.ReactNode;
  showTairoTitle?: boolean;
  onSelectConversation?: (conversationId: string) => void;
}

export function ChatLayout({ children, showTairoTitle = false, onSelectConversation }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen}
        onSelectConversation={onSelectConversation}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="button-toggle-sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
            {showTairoTitle && (
              <span className="text-lg font-semibold font-display">TAIRO</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <WorkspaceSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>

        {/* Profile Menu - Fixed bottom-left */}
        <div className="absolute bottom-4 left-4 z-30">
          <ProfileMenu />
        </div>
      </div>
    </div>
  );
}
