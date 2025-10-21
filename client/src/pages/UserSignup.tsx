import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

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
  const [authMethod, setAuthMethod] = useState<"form" | null>(null);
  const token = params?.token;

  const { data: invitation, isLoading, error } = useQuery<Invitation>({
    queryKey: ["/api/invitations", token],
    enabled: !!token,
  });

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      username: "",
    },
  });

  const acceptInvitation = useMutation({
    mutationFn: async (data: SignupForm) => {
      return await apiRequest("POST", `/api/invitations/${token}/accept`, data);
    },
    onSuccess: () => {
      navigate("/");
    },
  });

  const handleSocialSignup = (provider: "google" | "github") => {
    window.location.href = `/api/login?provider=${provider}&token=${token}`;
  };

  const handleEmailSignup = () => {
    setAuthMethod("form");
  };

  const onSubmit = (data: SignupForm) => {
    acceptInvitation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900">
        <div className="text-white">Loading invitation...</div>
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
              <Button onClick={() => navigate("/login")}>
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
              <Button onClick={() => navigate("/login")}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

            {!authMethod ? (
              <>
                {/* Social Signup Buttons */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialSignup("google")}
                  data-testid="button-signup-google"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialSignup("github")}
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
                  onClick={handleEmailSignup}
                  data-testid="button-signup-email"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Continue with Email
                </Button>
              </>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            data-testid="input-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="johndoe"
                            data-testid="input-username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={acceptInvitation.isPending}
                    data-testid="button-accept-invitation"
                  >
                    {acceptInvitation.isPending ? "Creating account..." : "Accept Invitation"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
