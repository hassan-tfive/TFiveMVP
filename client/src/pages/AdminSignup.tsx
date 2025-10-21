import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Mail, Building2 } from "lucide-react";
import { useLocation } from "wouter";

const signupSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function AdminSignup() {
  const [, navigate] = useLocation();
  const [authMethod, setAuthMethod] = useState<"form" | null>(null);

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      organizationName: "",
      email: "",
      name: "",
    },
  });

  const handleSocialSignup = (provider: "google" | "github") => {
    window.location.href = `/api/login?provider=${provider}&signup=true`;
  };

  const handleEmailSignup = () => {
    setAuthMethod("form");
  };

  const onSubmit = async (data: SignupForm) => {
    console.log("Signup data:", data);
    // TODO: Complete implementation with actual signup API
    // For now, redirect to onboarding
    navigate("/admin/onboarding");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-2">Tfive</h1>
          <p className="text-sm text-slate-300">Enterprise Personal Development</p>
        </div>

        {/* Signup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Enterprise Account</CardTitle>
            <CardDescription>
              Set up your organization and start driving team growth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  Sign up with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialSignup("github")}
                  data-testid="button-signup-github"
                >
                  <SiGithub className="mr-2 h-4 w-4" />
                  Sign up with GitHub
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
                  Sign up with Email
                </Button>
              </>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Acme Corp"
                              className="pl-10"
                              data-testid="input-org-name"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@company.com"
                            data-testid="input-email"
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
                    data-testid="button-submit-signup"
                  >
                    Create Account
                  </Button>
                </form>
              </Form>
            )}

            {/* Login Link */}
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-brand-teal hover:underline font-medium"
                data-testid="link-login"
              >
                Sign in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
