import { Crown, Sparkles, Brain, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";

interface ProgressDashboardProps {
  points: number;
  level: number;
  completedSessions: number;
  streak: number;
}

export function ProgressDashboard({ points, level, completedSessions, streak }: ProgressDashboardProps) {
  const { workspace } = useWorkspace();
  const pointsToNextLevel = level * 1000;
  const currentLevelProgress = (points % 1000) / 10;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className={cn(
        "hover-elevate",
        workspace === "professional" ? "border-workspace-professional" : "border-workspace-personal"
      )}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Level</CardTitle>
          <Crown className={cn(
            "w-4 h-4",
            workspace === "professional" ? "text-workspace-professional" : "text-workspace-personal"
          )} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display" data-testid="text-level">{level}</div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to Level {level + 1}</span>
              <span>{currentLevelProgress.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          <Sparkles className="w-4 h-4 text-chart-3" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display" data-testid="text-points">{points.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {pointsToNextLevel - (points % 1000)} points to next level
          </p>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Sessions</CardTitle>
          <Brain className="w-4 h-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display" data-testid="text-sessions">{completedSessions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Completed Pomodoro sessions
          </p>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-1">
          <CardTitle className="text-sm font-medium">Streak</CardTitle>
          <Zap className="w-4 h-4 text-chart-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display" data-testid="text-streak">{streak}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Days in a row
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
