import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProgramWizard } from "@/components/ProgramWizard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Sparkles, Clock, ChevronDown, ChevronUp, Play, BookOpen } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Program } from "@shared/schema";

interface Loop {
  id: string;
  programId: string;
  index: number;
  title: string;
  phaseLearnText: string;
  phaseActText: string;
  phaseEarnText: string;
  durLearn: number;
  durAct: number;
  durEarn: number;
}

export default function Programs() {
  const { workspace } = useWorkspace();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/programs?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  const { data: startedPrograms, isLoading: startedProgramsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs/started", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/programs/started?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch started programs");
      return res.json();
    },
  });

  const filteredPrograms = programs?.filter((program) => {
    const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (program.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || 
      (program.topic && program.topic === categoryFilter);
    return matchesSearch && matchesCategory;
  }) || [];

  const toggleProgramExpansion = (programId: string) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Program Library</h1>
          <p className="text-lg text-muted-foreground">
            Discover growth programs with AI-powered 25-minute sessions
          </p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className={cn(
            "text-white hover:text-white",
            workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
          )}
          data-testid="button-create-program"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Program
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-programs"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
          <SelectTrigger className="w-full md:w-[180px]" data-testid="select-category">
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            <SelectItem value="focus">Focus</SelectItem>
            <SelectItem value="confidence">Confidence</SelectItem>
            <SelectItem value="leadership">Leadership</SelectItem>
            <SelectItem value="recovery">Recovery</SelectItem>
            <SelectItem value="stress">Stress Management</SelectItem>
            <SelectItem value="creativity">Creativity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Started Programs Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-semibold">Started Programs</h2>
        {startedProgramsLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : startedPrograms && startedPrograms.length > 0 ? (
          <div className="space-y-4">
            {startedPrograms.map((program) => (
              <ProgramCardWithLoops
                key={program.id}
                program={program}
                isExpanded={expandedPrograms.has(program.id)}
                onToggleExpand={() => toggleProgramExpansion(program.id)}
                onStartSession={(loopId: string) => setLocation(`/session/${loopId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No programs started yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Once you start a program, you'll see it here to continue your progress
            </p>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-display font-semibold">All Programs</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No programs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or create a new program
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrograms.map((program) => (
            <ProgramCardWithLoops
              key={program.id}
              program={program}
              isExpanded={expandedPrograms.has(program.id)}
              onToggleExpand={() => toggleProgramExpansion(program.id)}
              onStartSession={(loopId: string) => setLocation(`/session/${loopId}`)}
            />
          ))}
        </div>
      )}

      <ProgramWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}

interface ProgramCardWithLoopsProps {
  program: Program;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStartSession: (loopId: string) => void;
}

function ProgramCardWithLoops({ program, isExpanded, onToggleExpand, onStartSession }: ProgramCardWithLoopsProps) {
  const { workspace } = useWorkspace();
  
  const { data: loops = [] } = useQuery<Loop[]>({
    queryKey: ["/api/programs", program.id, "loops"],
    queryFn: async () => {
      const res = await fetch(`/api/programs/${program.id}/loops`);
      if (!res.ok) throw new Error("Failed to fetch loops");
      return res.json();
    },
    enabled: isExpanded,
  });

  const programType = program.type || "one_off";
  const totalLoops = loops.length;
  const completedLoops = 0; // TODO: Track completed loops

  const typeLabel = {
    one_off: "One-time Session",
    short_series: "Short Series",
    mid_series: "Mid Series",
    long_series: "Long Series",
  }[programType] || "Program";

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl font-display">{program.title}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {typeLabel}
                </Badge>
                {program.topic && (
                  <Badge 
                    className={cn(
                      "text-xs",
                      workspace === "professional" ? "bg-workspace-professional text-white" : "bg-workspace-personal text-white"
                    )}
                  >
                    {program.topic}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {program.description || "AI-generated growth program"}
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" data-testid={`button-expand-${program.id}`}>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {totalLoops > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {completedLoops} of {totalLoops} sessions completed
                </span>
                <Progress value={(completedLoops / totalLoops) * 100} className="w-32 h-2" />
              </div>
            )}

            <div className="space-y-2">
              {loops.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No sessions available yet
                </div>
              ) : (
                loops.map((loop) => (
                  <Card key={loop.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Session {loop.index}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{loop.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-timer-learn" />
                              {loop.durLearn}m Learn
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-timer-act" />
                              {loop.durAct}m Act
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-timer-earn" />
                              {loop.durEarn}m Earn
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/program/${loop.id}`)}
                            data-testid={`button-view-details-${loop.id}`}
                          >
                            <BookOpen className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onStartSession(loop.id)}
                            className={cn(
                              "text-white hover:text-white",
                              workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
                            )}
                            data-testid={`button-start-session-${loop.id}`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
