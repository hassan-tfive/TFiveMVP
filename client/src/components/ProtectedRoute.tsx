import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return <>{children}</>;
}
