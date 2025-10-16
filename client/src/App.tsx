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
import Dashboard from "@/pages/Dashboard";
import Programs from "@/pages/Programs";
import ChatPage from "@/pages/ChatPage";
import SessionPage from "@/pages/SessionPage";
import Achievements from "@/pages/Achievements";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/programs" component={Programs} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/session/:id" component={SessionPage} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
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
                  <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-background via-background/98 to-background backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
                    <div className="flex items-center gap-6">
                      <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-elevate active-elevate-2" />
                      <Link href="/" className="flex items-center group">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <img src={logoUrl} alt="Tfive" className="h-11 w-auto relative z-10 cursor-pointer transition-all group-hover:scale-105" data-testid="img-logo" />
                        </div>
                      </Link>
                    </div>
                    <WorkspaceSwitcher />
                    <div className="flex items-center gap-3">
                      <ThemeToggle />
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
