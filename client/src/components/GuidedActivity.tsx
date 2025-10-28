import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, Move, Heart, Play, Pause, CheckCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityStep {
  id: string;
  instruction: string;
  duration: number; // in seconds
  visualCue?: "inhale" | "exhale" | "hold" | "move" | "rest";
}

interface GuidedActivityProps {
  title: string;
  type: "breathing" | "movement" | "relaxation";
  description?: string;
  steps: ActivityStep[];
  totalDuration?: number; // total minutes for the activity
  onComplete?: () => void;
}

export function GuidedActivity({ 
  title, 
  type, 
  description, 
  steps, 
  totalDuration,
  onComplete 
}: GuidedActivityProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentStep = steps[currentStepIndex];

  // Timer effect
  useEffect(() => {
    if (!isActive || isPaused || !currentStep) return;
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next step or complete
          if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
            return steps[currentStepIndex + 1].duration;
          } else {
            // Activity complete
            setIsActive(false);
            setIsComplete(true);
            onComplete?.();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isPaused, currentStepIndex, currentStep, steps, onComplete]);

  const handleStart = () => {
    if (steps.length === 0) return;
    setIsActive(true);
    setIsPaused(false);
    setIsComplete(false);
    setCurrentStepIndex(0);
    setTimeRemaining(steps[0].duration);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleRestart = () => {
    handleStart();
  };

  const getActivityIcon = () => {
    switch (type) {
      case "breathing":
        return <Wind className="w-6 h-6" />;
      case "movement":
        return <Move className="w-6 h-6" />;
      case "relaxation":
        return <Heart className="w-6 h-6" />;
    }
  };

  const getActivityColor = () => {
    switch (type) {
      case "breathing":
        return "text-blue-500";
      case "movement":
        return "text-orange-500";
      case "relaxation":
        return "text-purple-500";
    }
  };

  const getVisualCueDisplay = (cue?: string) => {
    switch (cue) {
      case "inhale":
        return { text: "Breathe In", color: "bg-blue-500" };
      case "exhale":
        return { text: "Breathe Out", color: "bg-blue-400" };
      case "hold":
        return { text: "Hold", color: "bg-blue-300" };
      case "move":
        return { text: "Move", color: "bg-orange-500" };
      case "rest":
        return { text: "Rest", color: "bg-green-500" };
      default:
        return { text: "Focus", color: "bg-primary" };
    }
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-12 space-y-4" data-testid="activity-empty">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          {getActivityIcon()}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">No Activity Steps</h3>
          <p className="text-muted-foreground">This activity doesn't have any steps configured yet.</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-6 text-center" data-testid="activity-complete">
        <div className="w-24 h-24 mx-auto rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold mb-2">Activity Complete!</h3>
          <p className="text-muted-foreground">Great work! You've completed the {type} exercise.</p>
        </div>
        <Button onClick={handleRestart} data-testid="button-activity-restart">
          <RotateCcw className="w-4 h-4 mr-2" />
          Do It Again
        </Button>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="space-y-6" data-testid="activity-intro">
        <div className={cn("flex items-center gap-3", getActivityColor())}>
          {getActivityIcon()}
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
        
        {description && (
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Activity Steps
          </h3>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                data-testid={`activity-step-preview-${index}`}
              >
                <Badge variant="outline" className="mt-0.5">
                  {index + 1}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm">{step.instruction}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.duration} seconds
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalDuration && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Total time: {totalDuration} minutes</span>
          </div>
        )}

        <Button 
          onClick={handleStart} 
          size="lg" 
          className="w-full"
          data-testid="button-activity-start"
        >
          <Play className="w-4 h-4 mr-2" />
          Begin Activity
        </Button>
      </div>
    );
  }

  const visualCue = getVisualCueDisplay(currentStep.visualCue);

  return (
    <div className="space-y-8" data-testid="activity-active">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          Step {currentStepIndex + 1} of {steps.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          {totalDuration && `${totalDuration} min activity`}
        </div>
      </div>

      {/* Visual Cue */}
      <div className={cn(
        "relative h-48 rounded-2xl flex items-center justify-center transition-all duration-1000",
        visualCue.color,
        currentStep.visualCue === "inhale" && "scale-110",
        currentStep.visualCue === "exhale" && "scale-90"
      )} data-testid="activity-visual-cue">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-white">
            {timeRemaining}s
          </div>
          <div className="text-xl font-medium text-white/90">
            {visualCue.text}
          </div>
        </div>
      </div>

      {/* Current Instruction */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium" data-testid="activity-instruction">
          {currentStep.instruction}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handlePause}
          className="flex-1"
          data-testid="button-activity-pause"
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4 mr-2" />
              Resume
            </>
          ) : (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </>
          )}
        </Button>
      </div>

      {/* Upcoming Steps Preview */}
      {currentStepIndex < steps.length - 1 && (
        <div className="pt-4 border-t">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Next
          </h4>
          <p className="text-sm text-muted-foreground">
            {steps[currentStepIndex + 1].instruction}
          </p>
        </div>
      )}
    </div>
  );
}
