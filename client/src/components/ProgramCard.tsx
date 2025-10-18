import { Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Program } from "@shared/schema";
import tairoLogoUrl from "@assets/v3 - crimson text font-09_1760728277194.png";

interface ProgramCardProps {
  program: Program;
  isCompleted?: boolean;
  progressPercent?: number;
  onClick?: () => void;
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-600 text-white",
  intermediate: "bg-yellow-600 text-white",
  advanced: "bg-red-600 text-white",
};

const CATEGORY_COLORS = {
  wellbeing: "bg-blue-600 text-white",
  recovery: "bg-orange-600 text-white",
  inclusion: "bg-purple-600 text-white",
  focus: "bg-indigo-600 text-white",
};

export function ProgramCard({ program, isCompleted, progressPercent, onClick }: ProgramCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover-elevate relative overflow-hidden",
        isCompleted && "border-green-500"
      )}
      onClick={onClick}
      data-testid={`card-program-${program.id}`}
    >
      {program.imageUrl && (
        <div className="h-40 overflow-hidden relative">
          <img
            src={program.imageUrl}
            alt={program.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
          <img 
            src={tairoLogoUrl} 
            alt="Tairo" 
            className="absolute top-0 right-0 w-12 h-12 opacity-40" 
          />
        </div>
      )}
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 z-10">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )}
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-display">{program.title}</CardTitle>
          <Badge className={cn("text-xs", DIFFICULTY_COLORS[program.difficulty as keyof typeof DIFFICULTY_COLORS])}>
            {program.difficulty}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{program.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{program.duration} min</span>
          </div>
          <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[program.category as keyof typeof CATEGORY_COLORS])}>
            {program.category}
          </Badge>
        </div>
        {progressPercent !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
