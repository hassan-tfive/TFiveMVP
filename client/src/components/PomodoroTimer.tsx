import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SessionPhase } from "@shared/schema";

interface PomodoroTimerProps {
  programTitle: string;
  onPhaseChange?: (phase: SessionPhase) => void;
  onComplete?: () => void;
}

const PHASE_DURATIONS = {
  learn: 5 * 60, // 5 minutes
  act: 15 * 60, // 15 minutes
  earn: 5 * 60, // 5 minutes
};

const PHASE_LABELS = {
  learn: "Learn",
  act: "Act",
  earn: "Earn",
};

const PHASE_COLORS = {
  learn: "timer-learn",
  act: "timer-act",
  earn: "timer-earn",
};

export function PomodoroTimer({ programTitle, onPhaseChange, onComplete }: PomodoroTimerProps) {
  const [phase, setPhase] = useState<SessionPhase>("learn");
  const [timeRemaining, setTimeRemaining] = useState(PHASE_DURATIONS.learn);
  const [isRunning, setIsRunning] = useState(false);

  const totalTime = PHASE_DURATIONS[phase];
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Move to next phase
      if (phase === "learn") {
        setPhase("act");
        setTimeRemaining(PHASE_DURATIONS.act);
        onPhaseChange?.("act");
      } else if (phase === "act") {
        setPhase("earn");
        setTimeRemaining(PHASE_DURATIONS.earn);
        onPhaseChange?.("earn");
      } else if (phase === "earn") {
        setIsRunning(false);
        onComplete?.();
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, phase, onPhaseChange, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase("learn");
    setTimeRemaining(PHASE_DURATIONS.learn);
  };

  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-muted-foreground">{programTitle}</h3>
          <div className="flex items-center justify-center gap-2">
            {(["learn", "act", "earn"] as SessionPhase[]).map((p) => (
              <div
                key={p}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-all",
                  phase === p
                    ? `bg-${PHASE_COLORS[p]} text-white`
                    : "bg-muted text-muted-foreground"
                )}
              >
                {PHASE_LABELS[p]}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-center">
            <div className={cn(
              "relative w-64 h-64 rounded-full flex items-center justify-center",
              "border-8 transition-colors",
              `border-${PHASE_COLORS[phase]}`
            )}>
              <div className="text-center">
                <div className="text-6xl font-mono font-bold" data-testid="text-timer">
                  {formatTime(timeRemaining)}
                </div>
                <div className={cn(
                  "text-lg font-semibold mt-2",
                  `text-${PHASE_COLORS[phase]}`
                )}>
                  {PHASE_LABELS[phase]}
                </div>
              </div>
            </div>
          </div>
          <div className={cn(
            "absolute inset-0 rounded-full",
            "pointer-events-none"
          )}
            style={{
              background: `conic-gradient(hsl(var(--${PHASE_COLORS[phase]})) ${progress}%, transparent ${progress}%)`,
              opacity: 0.2,
            }}
          />
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            data-testid="button-timer-toggle"
            className={cn(
              "gap-2",
              isRunning ? "bg-destructive hover:bg-destructive/90" : `bg-${PHASE_COLORS[phase]}`
            )}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleReset}
            data-testid="button-timer-reset"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
