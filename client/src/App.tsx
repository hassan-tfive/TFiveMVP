import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ChatLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Programs from "@/pages/Programs";
import ChatHome from "@/pages/ChatHome";
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
import Billings from "@/pages/Billings";
import Plans from "@/pages/Plans";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public auth routes that don't need app shell
function AuthRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin/signup" component={AdminSignup} />
      <Route path="/signup/:token" component={UserSignup} />
      <Route path="/admin/onboarding">
        <ProtectedRoute>
          <AdminOnboarding />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// Protected app routes with ChatLayout
function AppRoutes() {
  return (
    <ChatLayout>
      <Switch>
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/programs">
          <ProtectedRoute>
            <Programs />
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
        <Route path="/admin/team">
          <ProtectedRoute requireAdmin>
            <TeamManagement />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/billings">
          <ProtectedRoute requireAdmin>
            <Billings />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/plans">
          <ProtectedRoute requireAdmin>
            <Plans />
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </ChatLayout>
  );
}


function MainRouter() {
  const [location] = useLocation();
  
  // Check if we're on an auth route (no sidebar/header)
  const isAuthRoute = location === "/login" || 
                      location === "/admin/signup" || 
                      location === "/admin/onboarding" ||
                      location.startsWith("/signup/");

  // Check if we're on the chat home page (uses its own layout)
  const isChatHome = location === "/";

  if (isAuthRoute) {
    return <AuthRoutes />;
  }

  if (isChatHome) {
    return (
      <ProtectedRoute>
        <ChatHome />
      </ProtectedRoute>
    );
  }

  return <AppRoutes />;
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
