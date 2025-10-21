import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Mail } from "lucide-react";

export default function AdminSignup() {
  const handleAuthSignup = () => {
    window.location.href = `/api/login?signup=admin`;
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
            {/* Social Signup Buttons */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAuthSignup}
              data-testid="button-signup-google"
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAuthSignup}
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
              onClick={handleAuthSignup}
              data-testid="button-signup-email"
            >
              <Mail className="mr-2 h-4 w-4" />
              Sign up with Email
            </Button>

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
