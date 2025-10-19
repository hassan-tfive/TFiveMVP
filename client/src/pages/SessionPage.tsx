import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Loop {
  id: string;
  programId: string;
  index: number;
  title: string;
  phaseLearnText: string;
  phaseActText: string;
  phaseEarnText: string;
  durLearn: number;
  durAct: number;
  durEarn: number;
}

interface Session {
  id: string;
  userId: string;
  loopId: string;
  programId?: string;
  status: "in_progress" | "completed";
  phase: "learn" | "act" | "earn";
  timeRemaining: number;
  workspace: string;
}

type Phase = "learn" | "act" | "earn";

export default function SessionPage() {
  const { id: loopId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("learn");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [reflection, setReflection] = useState("");
  const [showReflection, setShowReflection] = useState(false);

  // Fetch loop data
  const { data: loop, isLoading: isLoadingLoop } = useQuery<Loop>({
    queryKey: ["/api/loops", loopId],
    queryFn: async () => {
      const res = await fetch(`/api/loops/${loopId}`);
      if (!res.ok) throw new Error("Failed to fetch loop");
      return res.json();
    },
    enabled: !!loopId,
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sessions/start", { loop_id: loopId });
    },
    onSuccess: (data: any) => {
      setSessionId(data.session_id);
      setCurrentPhase("learn");
      setTimeRemaining((loop?.durLearn || 8) * 60);
      setIsRunning(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("No session ID");
      return apiRequest("POST", `/api/sessions/${sessionId}/complete`, {
        reflection: reflection.trim() || undefined,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Session Completed!",
        description: `You earned ${data.points_awarded} points!`,
      });
      setLocation("/programs");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up for current phase
          if (currentPhase === "learn") {
            setCurrentPhase("act");
            return (loop?.durAct || 13) * 60;
          } else if (currentPhase === "act") {
            setCurrentPhase("earn");
            return (loop?.durEarn || 4) * 60;
          } else {
            // Session complete
            setIsRunning(false);
            setShowReflection(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, currentPhase, loop]);

  // Auto-start session when loop loads
  useEffect(() => {
    if (loop && !sessionId) {
      startSessionMutation.mutate();
    }
  }, [loop]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleSkipPhase = () => {
    if (currentPhase === "learn") {
      setCurrentPhase("act");
      setTimeRemaining((loop?.durAct || 13) * 60);
    } else if (currentPhase === "act") {
      setCurrentPhase("earn");
      setTimeRemaining((loop?.durEarn || 4) * 60);
    } else {
      setShowReflection(true);
    }
  };

  const handleComplete = () => {
    completeSessionMutation.mutate();
  };

  if (isLoadingLoop || !loop) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  const totalDuration = loop.durLearn + loop.durAct + loop.durEarn;
  const phaseDuration = currentPhase === "learn" 
    ? loop.durLearn 
    : currentPhase === "act" 
    ? loop.durAct 
    : loop.durEarn;
  
  const progress = ((phaseDuration * 60 - timeRemaining) / (phaseDuration * 60)) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const phaseColors = {
    learn: "bg-timer-learn",
    act: "bg-timer-act",
    earn: "bg-timer-earn",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/programs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">{loop.title}</h1>
          <p className="text-muted-foreground">25-minute growth session • Loop #{loop.index}</p>
        </div>
      </div>

      {/* Timer Display */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {currentPhase === "learn" ? "Learn" : currentPhase === "act" ? "Act" : "Earn"}
              </CardTitle>
              <CardDescription>
                {currentPhase === "learn" 
                  ? `${loop.durLearn} minute learning phase` 
                  : currentPhase === "act" 
                  ? `${loop.durAct} minute action phase` 
                  : `${loop.durEarn} minute reflection phase`}
              </CardDescription>
            </div>
            <div className={cn("w-4 h-4 rounded-full", phaseColors[currentPhase])} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold tracking-tight">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <Progress value={progress} className="mt-4 h-3" />
          </div>

          {/* Phase Content */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-base leading-relaxed">
                {currentPhase === "learn" 
                  ? loop.phaseLearnText 
                  : currentPhase === "act" 
                  ? loop.phaseActText 
                  : loop.phaseEarnText}
              </p>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleToggleTimer}
              variant="default"
              size="lg"
              className={cn(
                "text-white hover:text-white",
                workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
              )}
              data-testid="button-toggle-timer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
            <Button
              onClick={handleSkipPhase}
              variant="outline"
              size="lg"
              data-testid="button-skip-phase"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip Phase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reflection Dialog */}
      {showReflection && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Session Complete!
            </CardTitle>
            <CardDescription>
              Take a moment to reflect on your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reflection">Your Reflection (Optional)</Label>
              <Textarea
                id="reflection"
                placeholder="What did you learn? What will you do differently? How do you feel?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-reflection"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleComplete}
              className={cn(
                "w-full text-white hover:text-white",
                workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
              )}
              disabled={completeSessionMutation.isPending}
              data-testid="button-complete-session"
            >
              {completeSessionMutation.isPending ? (
                "Completing..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Session (+100 points)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
