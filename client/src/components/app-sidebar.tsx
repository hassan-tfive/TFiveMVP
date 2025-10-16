import { Home, Library, MessageSquare, Trophy, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import logoUrl from "@assets/v3 - crimson text font-03_1760641985520.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Programs", url: "/programs", icon: Library },
  { title: "Chat with Tairo", url: "/chat", icon: MessageSquare },
  { title: "Achievements", url: "/achievements", icon: Trophy },
];

const adminMenuItem = { title: "Admin", url: "/admin", icon: Shield };

export function AppSidebar() {
  const [location] = useLocation();
  const { workspace } = useWorkspace();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const isAdmin = user?.role === "admin";

  const allMenuItems = isAdmin ? [...menuItems, adminMenuItem] : menuItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 py-4">
            <img src={logoUrl} alt="Tfive" className="h-8 w-auto" data-testid="img-logo" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => (
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
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
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
