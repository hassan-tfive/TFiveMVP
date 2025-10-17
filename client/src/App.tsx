import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AppSidebar } from "@/components/app-sidebar";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoUrl from "@assets/v3 - crimson text font-03_1760641985520.png";
import { Link } from "wouter";
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
import { UserCircle, LogOut } from "lucide-react";
import type { User } from "@shared/schema";
import Dashboard from "@/pages/Dashboard";
import Programs from "@/pages/Programs";
import ChatPage from "@/pages/ChatPage";
import SessionPage from "@/pages/SessionPage";
import Achievements from "@/pages/Achievements";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/Profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/programs" component={Programs} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/session/:id" component={SessionPage} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UserMenu() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user.displayName || user.username;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover-elevate active-elevate-2 overflow-visible" data-testid="button-user-menu">
          <Avatar className="w-11 h-11 cursor-pointer border-2 border-[hsl(var(--nav-accent))]">
            <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-[hsl(var(--nav-accent))] text-white text-base font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-profile">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WorkspaceProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="sticky top-0 z-50 bg-gradient-to-r from-[hsl(var(--nav-bg-start))] to-[hsl(var(--nav-bg-end))] border-b-4 border-[hsl(var(--nav-accent))] shadow-2xl">
                    <div className="max-w-[1800px] mx-auto flex items-center justify-between px-8 py-6">
                      <div className="flex items-center gap-8">
                        <SidebarTrigger 
                          data-testid="button-sidebar-toggle" 
                          className="text-[hsl(var(--nav-foreground))] hover-elevate active-elevate-2" 
                        />
                        <Link href="/" className="flex items-center group">
                          <div className="relative px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover-elevate active-elevate-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--nav-accent))]/30 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                            <img src={logoUrl} alt="Tfive" className="h-12 w-auto relative z-10 cursor-pointer brightness-0 invert" data-testid="img-logo" />
                          </div>
                        </Link>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <WorkspaceSwitcher />
                      </div>
                      <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <UserMenu />
                      </div>
                    </div>
                  </header>
                  <main className="flex-1 overflow-auto p-6">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <Toaster />
          </TooltipProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
