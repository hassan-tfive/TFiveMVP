import { createContext, useContext, useState, useEffect } from "react";
import type { Workspace } from "@shared/schema";

interface WorkspaceContextType {
  workspace: Workspace;
  setWorkspace: (workspace: Workspace) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    const stored = localStorage.getItem("tfive-workspace");
    return (stored as Workspace) || "professional";
  });

  useEffect(() => {
    localStorage.setItem("tfive-workspace", workspace);
  }, [workspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
