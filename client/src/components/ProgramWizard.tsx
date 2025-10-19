import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";

interface ProgramWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WizardData {
  topic: string;
  goal: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "";
  category: "wellbeing" | "recovery" | "inclusion" | "focus" | "";
  workspace: "professional" | "personal" | "both" | "";
}

const STEPS = [
  { id: 1, title: "Topic", description: "What do you want to focus on?" },
  { id: 2, title: "Goal", description: "What do you want to achieve?" },
  { id: 3, title: "Details", description: "Choose difficulty and category" },
  { id: 4, title: "Workspace", description: "Where should this program live?" },
];

export function ProgramWizard({ open, onOpenChange }: ProgramWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    topic: "",
    goal: "",
    difficulty: "",
    category: "",
    workspace: "",
  });
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const createProgramMutation = useMutation({
    mutationFn: async (wizardData: Omit<WizardData, "workspace"> & { workspace: "professional" | "personal" | "both" }) => {
      return apiRequest("POST", "/api/programs/generate", wizardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Program Created!",
        description: "Your personalized program is ready. Check the Programs page!",
      });
      onOpenChange(false);
      resetWizard();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create program. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetWizard = () => {
    setStep(1);
    setData({
      topic: "",
      goal: "",
      difficulty: "",
      category: "",
      workspace: "",
    });
  };

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      // Final step - create program
      if (data.workspace) {
        createProgramMutation.mutate(data as Omit<WizardData, "workspace"> & { workspace: "professional" | "personal" | "both" });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.topic.trim().length > 0;
      case 2:
        return data.goal.trim().length > 0;
      case 3:
        return data.difficulty && data.category;
      case 4:
        return data.workspace;
      default:
        return false;
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className={cn(
              "w-5 h-5",
              workspace === "professional" ? "text-workspace-professional" : "text-workspace-personal"
            )} />
            Create Your Program
          </DialogTitle>
          <DialogDescription>
            Step {step} of {STEPS.length}: {STEPS[step - 1].description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="h-2" />

          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="topic">What would you like to focus on?</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Managing stress, Building confidence, Deep work..."
                  value={data.topic}
                  onChange={(e) => setData({ ...data, topic: e.target.value })}
                  data-testid="input-topic"
                />
                <p className="text-sm text-muted-foreground">
                  Be specific about what you want to work on
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="goal">What specific goal do you want to achieve?</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., I want to reduce my stress levels and feel more calm during work hours..."
                  value={data.goal}
                  onChange={(e) => setData({ ...data, goal: e.target.value })}
                  className="min-h-[100px]"
                  data-testid="input-goal"
                />
                <p className="text-sm text-muted-foreground">
                  Describe what success looks like for you
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={data.difficulty}
                    onValueChange={(value) => setData({ ...data, difficulty: value as WizardData["difficulty"] })}
                  >
                    <SelectTrigger data-testid="select-difficulty">
                      <SelectValue placeholder="Choose difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner - New to this area</SelectItem>
                      <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                      <SelectItem value="advanced">Advanced - Ready for a challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={data.category}
                    onValueChange={(value) => setData({ ...data, category: value as WizardData["category"] })}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wellbeing">Wellbeing - Mental health & balance</SelectItem>
                      <SelectItem value="recovery">Recovery - Resilience & healing</SelectItem>
                      <SelectItem value="inclusion">Inclusion - Empathy & connection</SelectItem>
                      <SelectItem value="focus">Focus - Concentration & productivity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <Label htmlFor="workspace">Which workspace should this program be in?</Label>
                <Select
                  value={data.workspace}
                  onValueChange={(value) => setData({ ...data, workspace: value as WizardData["workspace"] })}
                >
                  <SelectTrigger data-testid="select-workspace">
                    <SelectValue placeholder="Choose workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional - Career & workplace</SelectItem>
                    <SelectItem value="personal">Personal - Private self-discovery</SelectItem>
                    <SelectItem value="both">Both - Available in both workspaces</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  You can always access programs from the Programs page
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || createProgramMutation.isPending}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || createProgramMutation.isPending}
              className={cn(
                "text-white hover:text-white",
                workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
              )}
              data-testid="button-next"
            >
              {createProgramMutation.isPending ? (
                "Creating..."
              ) : step === STEPS.length ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Program
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
