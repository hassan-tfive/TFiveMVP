import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspace();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
      <button
        onClick={() => setWorkspace("professional")}
        data-testid="button-workspace-professional"
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          workspace === "professional"
            ? "bg-workspace-professional text-white"
            : "text-muted-foreground hover-elevate"
        )}
      >
        <Briefcase className="w-4 h-4" />
        <span>Professional</span>
      </button>
      <button
        onClick={() => setWorkspace("personal")}
        data-testid="button-workspace-personal"
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
          workspace === "personal"
            ? "bg-workspace-personal text-white"
            : "text-muted-foreground hover-elevate"
        )}
      >
        <User className="w-4 h-4" />
        <span>Personal</span>
      </button>
    </div>
  );
}
