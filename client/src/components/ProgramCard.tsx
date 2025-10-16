import { Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Program } from "@shared/schema";

interface ProgramCardProps {
  program: Program;
  isCompleted?: boolean;
  progressPercent?: number;
  onClick?: () => void;
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500",
  intermediate: "bg-yellow-500",
  advanced: "bg-red-500",
};

const CATEGORY_COLORS = {
  wellbeing: "bg-blue-500",
  recovery: "bg-orange-500",
  inclusion: "bg-purple-500",
  focus: "bg-indigo-500",
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
        <div className="h-40 overflow-hidden">
          <img
            src={program.imageUrl}
            alt={program.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
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
