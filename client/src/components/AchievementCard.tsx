import { Award, Lock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Achievement } from "@shared/schema";

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  progress?: number;
}

export function AchievementCard({ achievement, isUnlocked, progress = 0 }: AchievementCardProps) {
  const IconComponent = (LucideIcons as any)[achievement.icon] || Award;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        isUnlocked ? "hover-elevate" : "opacity-50 grayscale"
      )}
      data-testid={`card-achievement-${achievement.id}`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            isUnlocked ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" : "bg-muted"
          )}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-display">{achievement.title}</CardTitle>
            <CardDescription className="text-sm mt-1">{achievement.description}</CardDescription>
          </div>
          {!isUnlocked && (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        {!isUnlocked && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress} / {achievement.requirement}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((progress / achievement.requirement) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      {isUnlocked && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
          <Award className="w-4 h-4" />
        </div>
      )}
    </Card>
  );
}
