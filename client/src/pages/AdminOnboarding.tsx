import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Building2, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const step1Schema = z.object({
  companySize: z.string().min(1, "Please select company size"),
  industry: z.string().min(2, "Industry is required"),
});

const step2Schema = z.object({
  values: z.string().min(10, "Please describe your organizational values"),
  goals: z.string().min(10, "Please describe your development goals"),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;

export default function AdminOnboarding() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);

  const step1Form = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      companySize: "",
      industry: "",
    },
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      values: "",
      goals: "",
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async (data: Step1Form & Step2Form) => {
      return await apiRequest("POST", "/api/admin/organizations/onboard", data);
    },
    onSuccess: async () => {
      setCurrentStep(3);
      // Refetch (not just invalidate) user queries to ensure fresh data before navigation
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["/api/user"] }),
        queryClient.refetchQueries({ queryKey: ["/api/auth/user"] }),
      ]);
      // Navigate after ensuring fresh user data is fetched
      setTimeout(() => navigate("/admin"), 1500);
    },
  });

  const onStep1Submit = (data: Step1Form) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const onStep2Submit = (data: Step2Form) => {
    if (step1Data) {
      completeOnboarding.mutate({ ...step1Data, ...data });
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold text-white mb-2">Welcome to Tfive</h1>
          <p className="text-sm text-slate-300">Let's set up your organization</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-slate-300">
            Step {currentStep} of 3
          </p>
        </div>

        {/* Step 1: Company Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Company Information</CardTitle>
                  <CardDescription>Tell us about your organization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...step1Form}>
                <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
                  <FormField
                    control={step1Form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            data-testid="select-company-size"
                          >
                            <option value="">Select size...</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Technology, Healthcare, Finance"
                            data-testid="input-industry"
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
                    data-testid="button-next-step1"
                  >
                    Continue
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Values & Goals */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Values & Goals</CardTitle>
                  <CardDescription>Shape your development culture</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...step2Form}>
                <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
                  <FormField
                    control={step2Form.control}
                    name="values"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizational Values</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What values guide your organization? (e.g., innovation, collaboration, growth mindset)"
                            className="min-h-24 resize-none"
                            data-testid="textarea-values"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          These will help Tairo provide contextual guidance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Development Goals</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What are your team development priorities? (e.g., leadership skills, wellbeing, technical growth)"
                            className="min-h-24 resize-none"
                            data-testid="textarea-goals"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          We'll curate programs aligned with these goals
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="w-full"
                      data-testid="button-back"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={completeOnboarding.isPending}
                      data-testid="button-complete-onboarding"
                    >
                      {completeOnboarding.isPending ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-display font-bold">You're All Set!</h2>
                <p className="text-muted-foreground max-w-md">
                  Your organization is ready. Redirecting to your admin dashboard...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
