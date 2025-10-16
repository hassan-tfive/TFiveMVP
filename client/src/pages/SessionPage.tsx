import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Program, SessionPhase } from "@shared/schema";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useWorkspace();
  const { toast } = useToast();

  const { data: program } = useQuery<Program>({
    queryKey: ["/api/programs", id],
    queryFn: async () => {
      const res = await fetch(`/api/programs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch program");
      return res.json();
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sessions/complete", {
        programId: id,
        workspace,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Session Completed!",
        description: `You earned ${data.pointsEarned} points!`,
      });
    },
  });

  const [currentPhase, setCurrentPhase] = useState<SessionPhase>("learn");

  if (!program) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading program...</p>
        </div>
      </div>
    );
  }

  const phaseContent = program.content as any;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/programs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">{program.title}</h1>
          <p className="text-muted-foreground">{program.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PomodoroTimer
          programTitle={program.title}
          onPhaseChange={setCurrentPhase}
          onComplete={() => completeSessionMutation.mutate()}
        />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-timer-learn" />
                Learn (5 min)
              </CardTitle>
              <CardDescription>Absorb new knowledge and context</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{phaseContent?.learn || "Content loading..."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-timer-act" />
                Act (15 min)
              </CardTitle>
              <CardDescription>Apply what you've learned</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{phaseContent?.act || "Content loading..."}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-timer-earn" />
                Earn (5 min)
              </CardTitle>
              <CardDescription>Reflect and receive rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{phaseContent?.earn?.message || "Reflect on your progress"}</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-medium">+{phaseContent?.earn?.points || 100} points</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
