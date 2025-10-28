import { useQuery } from "@tanstack/react-query";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { ProgramCard } from "@/components/ProgramCard";
import { Clock, Sparkles } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import type { Program, User } from "@shared/schema";
import tfiveLogoWhiteUrl from "@assets/v3 - crimson text font-06_1760868063174.png";

export default function Dashboard() {
  const { workspace } = useWorkspace();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: startedPrograms, isLoading: startedProgramsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs/started", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/programs/started?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch started programs");
      return res.json();
    },
  });

  const { data: allPrograms = [], isLoading: allProgramsLoading } = useQuery<Program[]>({
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      <div className={cn(
        "rounded-lg px-6 transition-colors relative overflow-hidden",
        workspace === "professional" 
          ? "bg-[hsl(235,100%,9%)]" 
          : "bg-gradient-to-r from-[hsl(318,100%,50%)] to-[hsl(266,73%,40%)]"
      )}>
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold mb-1 text-white relative z-10">
              Chat with tairo
            </h1>
            <p className="text-sm text-white/90 relative z-10">
              {workspace === "professional"
                ? "Your professional development space - focused on career growth"
                : "Your personal sanctuary - private space for self-discovery"}
            </p>
          </div>
          <img 
            src={tfiveLogoWhiteUrl} 
            alt="Tfive" 
            className="h-20 w-auto relative z-10 flex-shrink-0 -my-4 -mr-6"
            data-testid="img-banner-logo" 
          />
        </div>
      </div>

      <ProgressDashboard
        points={user?.points || 0}
        level={user?.level || 1}
        completedSessions={stats?.completedSessions || 0}
        streak={stats?.streak || 0}
      />

      {/* Started Programs Section - Only show if loading or have started programs */}
      {(startedProgramsLoading || (startedPrograms && startedPrograms.length > 0)) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "w-5 h-5",
                workspace === "professional" ? "text-workspace-professional" : "text-workspace-personal"
              )} />
              <h2 className="text-2xl font-display font-semibold">Started Programs</h2>
            </div>
          </div>

          {startedProgramsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {startedPrograms?.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onClick={() => window.location.href = `/session/${program.id}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Programs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn(
              "w-5 h-5",
              workspace === "professional" ? "text-workspace-professional" : "text-workspace-personal"
            )} />
            <h2 className="text-2xl font-display font-semibold">Recommended for You</h2>
          </div>
        </div>

        {allProgramsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : allPrograms.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No programs available yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon for new programs
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {allPrograms.slice(0, 10).map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={() => window.location.href = `/session/${program.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
