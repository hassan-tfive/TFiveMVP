import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProgramWizard } from "@/components/ProgramWizard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, BookOpen, ArrowRight, Clock } from "lucide-react";
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
import type { Program } from "@shared/schema";

export default function Programs() {
  const { workspace } = useWorkspace();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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
      (program.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || 
      (program.topic && program.topic === categoryFilter);
    return matchesSearch && matchesCategory;
  }) || [];

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
            <SelectItem value="leadership">Leadership</SelectItem>
            <SelectItem value="recovery">Recovery</SelectItem>
            <SelectItem value="wellbeing">Wellbeing</SelectItem>
            <SelectItem value="inclusion">Inclusion</SelectItem>
            <SelectItem value="stress">Stress Management</SelectItem>
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
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No programs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or create a new program
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
            />
          ))}
        </div>
      )}

      <ProgramWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}

interface ProgramCardProps {
  program: Program;
}

function ProgramCard({ program }: ProgramCardProps) {
  const { workspace } = useWorkspace();
  const [, setLocation] = useLocation();

  const programType = program.type || "one_off";
  const typeLabel = {
    one_off: "One-time Session",
    short_series: "Short Series",
    mid_series: "Mid Series",
    long_series: "Long Series",
  }[programType] || "Program";

  // Fetch the first loop to navigate to its detail page
  const { data: loops } = useQuery<any[]>({
    queryKey: ["/api/programs", program.id, "loops"],
    queryFn: async () => {
      const res = await fetch(`/api/programs/${program.id}/loops`);
      if (!res.ok) throw new Error("Failed to fetch loops");
      return res.json();
    },
  });

  const firstLoop = loops?.[0];

  return (
    <Card className="overflow-hidden hover-elevate group cursor-pointer" onClick={() => firstLoop && setLocation(`/program/${firstLoop.id}`)}>
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        {program.imageUrl ? (
          <img 
            src={program.imageUrl} 
            alt={program.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/40 mb-2" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {program.topic || "Program"}
            </span>
          </div>
        )}
        {program.topic && (
          <Badge 
            className={cn(
              "absolute top-3 right-3 text-xs",
              workspace === "professional" ? "bg-workspace-professional text-white" : "bg-workspace-personal text-white"
            )}
          >
            {program.topic}
          </Badge>
        )}
      </div>
      
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-display line-clamp-2 flex-1">{program.title}</CardTitle>
        </div>
        <Badge variant="outline" className="text-xs w-fit">
          {typeLabel}
        </Badge>
        <CardDescription className="line-clamp-2">
          {program.description || "AI-generated growth program"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          className={cn(
            "w-full text-white hover:text-white group-hover:shadow-md transition-shadow",
            workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
          )}
          disabled={!firstLoop}
          data-testid={`button-view-program-${program.id}`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          View Program
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        {loops && loops.length > 1 && (
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{loops.length} sessions available</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
