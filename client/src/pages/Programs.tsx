import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProgramCard } from "@/components/ProgramCard";
import { ProgramWizard } from "@/components/ProgramWizard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Sparkles } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Program, ProgramCategory, ProgramDifficulty } from "@shared/schema";

export default function Programs() {
  const { workspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProgramCategory | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<ProgramDifficulty | "all">("all");
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs", workspace],
    queryFn: async () => {
      const res = await fetch(`/api/programs?workspace=${workspace}`);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return res.json();
    },
  });

  const filteredPrograms = programs?.filter((program) => {
    const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || program.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || program.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Program Library</h1>
          <p className="text-lg text-muted-foreground">
            Discover 25-minute Pomodoro programs for personal growth
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
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
          <SelectTrigger className="w-full md:w-[180px]" data-testid="select-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="wellbeing">Wellbeing</SelectItem>
            <SelectItem value="recovery">Recovery</SelectItem>
            <SelectItem value="inclusion">Inclusion</SelectItem>
            <SelectItem value="focus">Focus</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as any)}>
          <SelectTrigger className="w-full md:w-[180px]" data-testid="select-difficulty">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No programs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => window.location.href = `/session/${program.id}`}
            />
          ))}
        </div>
      )}

      <ProgramWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
