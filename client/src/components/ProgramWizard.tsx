import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, ArrowRight, ArrowLeft, Check, Zap, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface ProgramWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IntentContext {
  topic: string;
  emotion: string;
  scope_hint: "short_term" | "mid_term" | "long_term";
  space: "personal" | "work";
  confidence: number;
}

interface WizardQuestion {
  id: string;
  type: "choice" | "text";
  prompt: string;
  options?: string[];
}

export function ProgramWizard({ open, onOpenChange }: ProgramWizardProps) {
  const [mode, setMode] = useState<"prompt" | "wizard">("prompt");
  const [prompt, setPrompt] = useState("");
  const [intentContext, setIntentContext] = useState<IntentContext | null>(null);
  const [wizardQuestions, setWizardQuestions] = useState<WizardQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isParsingIntent, setIsParsingIntent] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      resetWizard();
    }
  }, [open]);

  const resetWizard = () => {
    setPrompt("");
    setIntentContext(null);
    setWizardQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsParsingIntent(false);
    setIsLoadingQuestions(false);
  };

  // Parse intent mutation
  const parseIntentMutation = useMutation({
    mutationFn: async (text: string): Promise<IntentContext> => {
      const response = await apiRequest("POST", "/api/intent/parse", {
        text,
        space: workspace === "professional" ? "work" : "personal",
      });
      return response as unknown as IntentContext;
    },
    onSuccess: async (data: IntentContext) => {
      setIntentContext(data);
      
      // If confidence is high enough, skip wizard and generate directly
      if (data.confidence >= 0.8) {
        // Generate program with default settings based on intent
        await generateProgram({
          topic: data.topic,
          tone: getDefaultTone(data.emotion),
          series_type: getSuggestedSeriesType(data.scope_hint),
          cadence_per_week: 3,
        });
      } else {
        // Load wizard questions
        loadWizardQuestions(data);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to understand your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load wizard questions
  const loadWizardQuestions = async (context: IntentContext) => {
    setIsLoadingQuestions(true);
    try {
      const response: any = await apiRequest("POST", "/api/wizard/next", {
        context,
        previous_answers: answers,
      });
      
      if (response.questions && response.questions.length > 0) {
        setWizardQuestions(response.questions);
        setCurrentQuestionIndex(0);
      } else {
        // No questions needed, generate program
        await generateProgram({
          topic: context.topic,
          tone: getDefaultTone(context.emotion),
          series_type: getSuggestedSeriesType(context.scope_hint),
          cadence_per_week: 3,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load wizard questions.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const createProgramMutation = useMutation({
    mutationFn: async (requestData: any): Promise<any> => {
      const response = await apiRequest("POST", "/api/programs/generate", requestData);
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Program Created!",
        description: "Your personalized program is ready.",
      });
      onOpenChange(false);
      resetWizard();
      
      // Navigate to the session page for the first loop
      if (data.next_loop?.id) {
        setLocation(`/session/${data.next_loop.id}`);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.error || "Failed to create program. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const generateProgram = async (inputs: any) => {
    createProgramMutation.mutate({
      space: workspace === "professional" ? "work" : "personal",
      inputs,
    });
  };

  const handlePromptSubmit = async () => {
    if (prompt.trim()) {
      setIsParsingIntent(true);
      await parseIntentMutation.mutateAsync(prompt.trim());
      setIsParsingIntent(false);
    }
  };

  const handleAnswerQuestion = (answer: any) => {
    const currentQuestion = wizardQuestions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    // Move to next question or generate program
    if (currentQuestionIndex < wizardQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, generate program
      if (intentContext) {
        generateProgram({
          topic: intentContext.topic,
          tone: newAnswers.tone || getDefaultTone(intentContext.emotion),
          series_type: newAnswers.scope || getSuggestedSeriesType(intentContext.scope_hint),
          cadence_per_week: newAnswers.cadence || 3,
          duration_weeks: newAnswers.duration,
        });
      }
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // Go back to intent parsing
      setWizardQuestions([]);
      setIntentContext(null);
      setAnswers({});
    }
  };

  const getDefaultTone = (emotion: string): string => {
    const toneMap: Record<string, string> = {
      anxious: "calm",
      stressed: "calm",
      calm: "calm",
      excited: "energizing",
      frustrated: "reflective",
      motivated: "energizing",
      tired: "calm",
      neutral: "instructional",
    };
    return toneMap[emotion] || "instructional";
  };

  const getSuggestedSeriesType = (scope: string): "one_off" | "short_series" | "mid_series" | "long_series" => {
    const typeMap: Record<string, "one_off" | "short_series" | "mid_series" | "long_series"> = {
      short_term: "one_off",
      mid_term: "short_series",
      long_term: "long_series",
    };
    return typeMap[scope] || "short_series";
  };

  const isLoading = isParsingIntent || isLoadingQuestions || createProgramMutation.isPending;
  const progress = wizardQuestions.length > 0 
    ? ((currentQuestionIndex + 1) / wizardQuestions.length) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className={cn(
              "w-5 h-5",
              workspace === "professional" ? "text-workspace-professional" : "text-workspace-personal"
            )} />
            Create Your Program
          </DialogTitle>
          <DialogDescription>
            Tell Tairo what you need and get a personalized growth program
          </DialogDescription>
        </DialogHeader>

        {/* Show wizard questions if we have them */}
        {wizardQuestions.length > 0 && intentContext ? (
          <div className="space-y-4">
            <div>
              <DialogDescription>
                Question {currentQuestionIndex + 1} of {wizardQuestions.length}
              </DialogDescription>
              <Progress value={progress} className="h-2 mt-2" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{wizardQuestions[currentQuestionIndex].prompt}</Label>
                {wizardQuestions[currentQuestionIndex].type === "choice" ? (
                  <Select
                    value={answers[wizardQuestions[currentQuestionIndex].id] || ""}
                    onValueChange={(value) => handleAnswerQuestion(value)}
                  >
                    <SelectTrigger data-testid="select-wizard-answer">
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {wizardQuestions[currentQuestionIndex].options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={answers[wizardQuestions[currentQuestionIndex].id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [wizardQuestions[currentQuestionIndex].id]: e.target.value })}
                    placeholder="Type your answer..."
                    data-testid="input-wizard-answer"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                data-testid="button-wizard-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => handleAnswerQuestion(answers[wizardQuestions[currentQuestionIndex].id])}
                disabled={!answers[wizardQuestions[currentQuestionIndex].id] || isLoading}
                className={cn(
                  "text-white hover:text-white",
                  workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
                )}
                data-testid="button-wizard-next"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : currentQuestionIndex === wizardQuestions.length - 1 ? (
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
        ) : (
          /* Initial prompt input */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">What do you need right now?</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., 'I need help staying focused during work', 'I want to feel more confident in meetings', 'Help me manage stress and relax'..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
                data-testid="input-prompt"
              />
              <p className="text-sm text-muted-foreground">
                Describe what you're feeling or what you want to work on. Tairo will understand and create a personalized program.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handlePromptSubmit}
                disabled={!prompt.trim() || isLoading}
                className={cn(
                  "text-white hover:text-white",
                  workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
                )}
                data-testid="button-create-from-prompt"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isParsingIntent ? "Understanding..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Program
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
