import { Trophy, Target, Flame, Award } from "lucide-react";
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Level</CardTitle>
          <Trophy className={cn(
            "w-5 h-5",
            workspace === "professional" ? "text-workspace-professional" : "text-workspace-personal"
          )} />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-display" data-testid="text-level">{level}</div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to Level {level + 1}</span>
              <span>{currentLevelProgress.toFixed(0)}%</span>
            </div>
            <Progress value={currentLevelProgress} className="h-1" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          <Target className="w-5 h-5 text-chart-3" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-display" data-testid="text-points">{points.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {pointsToNextLevel - (points % 1000)} points to next level
          </p>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sessions</CardTitle>
          <Award className="w-5 h-5 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-display" data-testid="text-sessions">{completedSessions}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Completed Pomodoro sessions
          </p>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Streak</CardTitle>
          <Flame className="w-5 h-5 text-chart-4" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-display" data-testid="text-streak">{streak}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Days in a row
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
