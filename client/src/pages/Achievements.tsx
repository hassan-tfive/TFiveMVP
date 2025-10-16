import { useQuery } from "@tanstack/react-query";
import { AchievementCard } from "@/components/AchievementCard";
import { Trophy } from "lucide-react";
import type { Achievement, UserAchievement } from "@shared/schema";

export default function Achievements() {
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user/achievements"],
  });

  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievementId) || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <div>
          <h1 className="text-4xl font-display font-bold">Achievements</h1>
          <p className="text-lg text-muted-foreground">
            Track your progress and unlock rewards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements?.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isUnlocked={unlockedIds.has(achievement.id)}
            progress={0}
          />
        ))}
      </div>
    </div>
  );
}
