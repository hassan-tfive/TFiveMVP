import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  teamId: string | null;
  organizationName: string;
  status: string;
}

export default function UserSignup() {
  const [, params] = useRoute("/signup/:token");
  const [, navigate] = useLocation();
  const token = params?.token;
  const { user, isLoading: userLoading } = useAuth();

  const { data: invitation, isLoading, error } = useQuery<Invitation>({
    queryKey: ["/api/invitations", token],
    enabled: !!token,
  });

  const acceptInvitation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/invitations/${token}/accept`, {});
    },
    onSuccess: () => {
      navigate("/");
    },
  });

  // Auto-accept invitation if user is authenticated
  useEffect(() => {
    if (user && invitation && invitation.status === "pending" && !acceptInvitation.isPending && !acceptInvitation.isSuccess) {
      acceptInvitation.mutate();
    }
  }, [user, invitation, acceptInvitation]);

  const handleAuthSignup = () => {
    window.location.href = `/api/login?token=${token}`;
  };

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-16 w-16 text-destructive" />
              </div>
              <h2 className="text-2xl font-display font-bold">Invalid Invitation</h2>
              <p className="text-muted-foreground">
                This invitation link is invalid or has expired.
              </p>
              <Button onClick={() => navigate("/login")} data-testid="button-go-login">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status !== "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold">Already Accepted</h2>
              <p className="text-muted-foreground">
                This invitation has already been accepted.
              </p>
              <Button onClick={() => navigate("/login")} data-testid="button-go-login-accepted">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is authenticated and invitation is pending, show accepting state
  if (user && invitation.status === "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="h-16 w-16 text-brand-teal animate-spin" />
              <h2 className="text-2xl font-display font-bold">Completing Setup...</h2>
              <p className="text-muted-foreground">
                We're setting up your account for {invitation.organizationName}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not authenticated - show signup options
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-2">Tfive</h1>
          <p className="text-sm text-slate-300">25 minutes to personal growth</p>
        </div>

        {/* Signup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Join {invitation.organizationName}</CardTitle>
            <CardDescription>
              You've been invited to join the team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Setting up account for <strong>{invitation.email}</strong>
              </AlertDescription>
            </Alert>

            {/* Social Signup Buttons */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAuthSignup}
              data-testid="button-signup-google"
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAuthSignup}
              data-testid="button-signup-github"
            >
              <SiGithub className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={handleAuthSignup}
              data-testid="button-signup-email"
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
