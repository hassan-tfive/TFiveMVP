import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Mail } from "lucide-react";

export default function Login() {
  const handleSocialLogin = (provider: "google" | "github") => {
    window.location.href = `/api/login?provider=${provider}`;
  };

  const handleEmailLogin = () => {
    window.location.href = "/api/login?provider=email";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-2">Tfive</h1>
          <p className="text-sm text-slate-300">25 minutes to personal growth</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to continue your growth journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin("google")}
              data-testid="button-login-google"
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin("github")}
              data-testid="button-login-github"
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
              onClick={handleEmailLogin}
              data-testid="button-login-email"
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Email
            </Button>

            {/* Signup Link */}
            <div className="text-center text-sm text-muted-foreground">
              New to Tfive?{" "}
              <a
                href="/admin/signup"
                className="text-brand-teal hover:underline font-medium"
                data-testid="link-admin-signup"
              >
                Create an enterprise account
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
