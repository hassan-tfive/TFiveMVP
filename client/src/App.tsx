import { Switch, Route, useLocation } from "wouter";
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
import Login from "@/pages/Login";
import AdminSignup from "@/pages/AdminSignup";
import AdminOnboarding from "@/pages/AdminOnboarding";
import UserSignup from "@/pages/UserSignup";
import TeamManagement from "@/pages/TeamManagement";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public auth routes that don't need app shell
function AuthRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin/signup" component={AdminSignup} />
      <Route path="/signup/:token" component={UserSignup} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Protected app routes with sidebar/header
function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/programs">
        <ProtectedRoute>
          <Programs />
        </ProtectedRoute>
      </Route>
      <Route path="/chat">
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      </Route>
      <Route path="/session/:id">
        <ProtectedRoute>
          <SessionPage />
        </ProtectedRoute>
      </Route>
      <Route path="/achievements">
        <ProtectedRoute>
          <Achievements />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/onboarding">
        <ProtectedRoute>
          <AdminOnboarding />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/team">
        <ProtectedRoute requireAdmin>
          <TeamManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
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
          <Avatar className="w-11 h-11 cursor-pointer">
            <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-base font-bold">
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
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => {
            window.location.href = "/api/logout";
          }}
          data-testid="menu-item-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-[1800px] mx-auto flex items-center justify-between px-8 py-4">
              <div className="flex items-center gap-6">
                <SidebarTrigger 
                  data-testid="button-sidebar-toggle" 
                  className="hover-elevate active-elevate-2" 
                />
                <WorkspaceSwitcher />
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <AppRoutes />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function MainRouter() {
  const [location] = useLocation();
  
  // Check if we're on an auth route
  const isAuthRoute = location === "/login" || 
                      location === "/admin/signup" || 
                      location.startsWith("/signup/");

  if (isAuthRoute) {
    return <AuthRoutes />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WorkspaceProvider>
          <TooltipProvider>
            <MainRouter />
            <Toaster />
          </TooltipProvider>
        </WorkspaceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
