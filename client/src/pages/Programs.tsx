import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProgramCard } from "@/components/ProgramCard";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Program Library</h1>
        <p className="text-lg text-muted-foreground">
          Discover growth programs with AI-powered 25-minute sessions
        </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No programs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or chat with Tairo to create a program
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onClick={() => window.location.href = `/session/${program.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
