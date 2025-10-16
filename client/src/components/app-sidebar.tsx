import { Home, Library, MessageSquare, Trophy, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Programs", url: "/programs", icon: Library },
  { title: "Chat with T", url: "/chat", icon: MessageSquare },
  { title: "Achievements", url: "/achievements", icon: Trophy },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { workspace } = useWorkspace();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-display font-semibold">Tfive</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "transition-colors",
                      location === item.url && (
                        workspace === "professional"
                          ? "bg-workspace-professional text-white hover:bg-workspace-professional/90"
                          : "bg-workspace-personal text-white hover:bg-workspace-personal/90"
                      )
                    )}
                    data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
