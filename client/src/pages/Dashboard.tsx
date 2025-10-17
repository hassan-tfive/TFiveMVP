import { useQuery } from "@tanstack/react-query";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { ProgramCard } from "@/components/ProgramCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import type { Program, User } from "@shared/schema";
import tairoLogoUrl from "@assets/v3 - crimson text font-09_1760728277194.png";
import tfiveLogoUrl from "@assets/v3 - crimson text font-02_1760728277193.png";

export default function Dashboard() {
  const { workspace } = useWorkspace();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ["/api/programs", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/programs?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  const { data: stats } = useQuery<{
    completedSessions: number;
    streak: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const recommendedPrograms = programs?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      <div className={cn(
        "rounded-lg py-4 px-8 transition-colors relative overflow-hidden",
        workspace === "professional" 
          ? "bg-[hsl(235,100%,9%)]" 
          : "bg-gradient-to-r from-[hsl(318,100%,50%)] to-[hsl(266,73%,40%)]"
      )}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-display font-bold mb-2 text-white relative z-10">
              Welcome back to Tfive!
            </h1>
            <p className="text-lg text-white/90 relative z-10">
              {workspace === "professional"
                ? "Your professional development space - focused on career growth"
                : "Your personal sanctuary - private space for self-discovery"}
            </p>
          </div>
          <img src={tfiveLogoUrl} alt="Tfive" className="h-full w-auto max-h-24 relative z-10 flex-shrink-0" data-testid="img-banner-logo" />
        </div>
      </div>

      <ProgressDashboard
        points={user?.points || 0}
        level={user?.level || 1}
        completedSessions={stats?.completedSessions || 0}
        streak={stats?.streak || 0}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn(
              "w-5 h-5",
              workspace === "professional" ? "text-workspace-professional" : "text-workspace-personal"
            )} />
            <h2 className="text-2xl font-display font-semibold">Recommended for You</h2>
          </div>
          <Button variant="ghost" asChild data-testid="link-view-all-programs">
            <Link href="/programs">
              View all programs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {recommendedPrograms.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No programs available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={() => window.location.href = `/session/${program.id}`}
              />
            ))}
          </div>
        )}
      </div>

      <Link href="/chat" data-testid="link-chat-with-tairo">
        <div className={cn(
          "rounded-lg p-6 cursor-pointer transition-all hover-elevate active-elevate-2 group",
          workspace === "professional" 
            ? "bg-[hsl(235,100%,9%)] text-white" 
            : "bg-gradient-to-r from-[hsl(318,100%,50%)] to-[hsl(266,73%,40%)] text-white"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <img src={tairoLogoUrl} alt="Tairo" className="w-8 h-8 animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Chat with Tairo</h3>
              <p className="text-sm text-white/80">
                Get personalized guidance and support
              </p>
            </div>
            <ArrowRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    </div>
  );
}
