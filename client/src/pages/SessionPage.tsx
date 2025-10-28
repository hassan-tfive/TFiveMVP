import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle2, BookOpen, Headphones, Video } from "lucide-react";
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
  audioLearnUrl?: string | null;
  audioActUrl?: string | null;
  audioEarnUrl?: string | null;
  videoUrl?: string | null;
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
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const [loopId, setLoopId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("learn");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [reflection, setReflection] = useState("");
  const [showReflection, setShowReflection] = useState(false);

  // Fetch program loops to determine if ID is a program or loop
  const { data: programLoops, isSuccess: programLoopsLoaded, isError: programLoopsError } = useQuery<Loop[] | null>({
    queryKey: ["/api/programs", id, "loops"],
    queryFn: async () => {
      const res = await fetch(`/api/programs/${id}/loops`);
      if (!res.ok) {
        // Not a program ID, assume it's a loop ID
        return null;
      }
      return res.json();
    },
    enabled: !!id,
    retry: false, // Don't retry if it's not a program
  });

  // Set the loop ID once we know if it's a program or loop
  useEffect(() => {
    if (programLoopsLoaded) {
      if (programLoops && programLoops.length > 0) {
        // It's a program ID, use the first loop
        setLoopId(programLoops[0].id);
      } else if (programLoops && programLoops.length === 0) {
        // Program exists but has no loops
        toast({
          title: "No Sessions Available",
          description: "This program doesn't have any sessions yet.",
          variant: "destructive",
        });
        setLocation("/programs");
      } else if (id) {
        // programLoops is null, so it's a loop ID
        setLoopId(id);
      }
    } else if (programLoopsError && id) {
      // Query failed, treat as loop ID
      setLoopId(id);
    }
  }, [programLoops, programLoopsLoaded, programLoopsError, id, setLocation, toast]);

  // Helper function to get current phase's audio URL
  const getCurrentAudioUrl = (): string | null => {
    if (!loop) return null;
    if (currentPhase === "learn") return loop.audioLearnUrl || null;
    if (currentPhase === "act") return loop.audioActUrl || null;
    if (currentPhase === "earn") return loop.audioEarnUrl || null;
    return null;
  };

  // Helper function to convert YouTube/Vimeo URLs to embed format
  const getEmbedUrl = (url: string): string => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url; // Return as-is if not recognized
  };

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

          {/* Phase Content with Read/Listen/Watch Tabs */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <Tabs defaultValue="read" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="read" className="flex items-center gap-2" data-testid="tab-read">
                    <BookOpen className="w-4 h-4" />
                    Read
                  </TabsTrigger>
                  <TabsTrigger 
                    value="listen" 
                    className="flex items-center gap-2" 
                    data-testid="tab-listen"
                    disabled={!getCurrentAudioUrl()}
                  >
                    <Headphones className="w-4 h-4" />
                    Listen
                  </TabsTrigger>
                  <TabsTrigger 
                    value="watch" 
                    className="flex items-center gap-2" 
                    data-testid="tab-watch"
                    disabled={!loop.videoUrl}
                  >
                    <Video className="w-4 h-4" />
                    Watch
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="read" className="min-h-[120px]">
                  <p className="text-base leading-relaxed">
                    {currentPhase === "learn" 
                      ? loop.phaseLearnText 
                      : currentPhase === "act" 
                      ? loop.phaseActText 
                      : loop.phaseEarnText}
                  </p>
                </TabsContent>
                
                <TabsContent value="listen" className="min-h-[120px]">
                  {getCurrentAudioUrl() ? (
                    <div className="space-y-4">
                      <audio
                        controls
                        className="w-full"
                        src={getCurrentAudioUrl() || ""}
                        data-testid="audio-player"
                      >
                        Your browser does not support audio playback.
                      </audio>
                      <p className="text-sm text-muted-foreground">
                        {currentPhase === "learn" 
                          ? loop.phaseLearnText 
                          : currentPhase === "act" 
                          ? loop.phaseActText 
                          : loop.phaseEarnText}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Audio not available for this phase.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="watch" className="min-h-[120px]">
                  {loop.videoUrl ? (
                    <div className="space-y-4">
                      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={getEmbedUrl(loop.videoUrl)}
                          title="Session Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          data-testid="video-player"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentPhase === "learn" 
                          ? loop.phaseLearnText 
                          : currentPhase === "act" 
                          ? loop.phaseActText 
                          : loop.phaseEarnText}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Video not available for this session.</p>
                  )}
                </TabsContent>
              </Tabs>
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
