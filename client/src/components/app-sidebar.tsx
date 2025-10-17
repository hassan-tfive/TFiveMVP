import { Home, Library, MessageSquare, Trophy, Shield, UserCircle, Hourglass } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Programs", url: "/programs", icon: Library },
  { title: "Chat with Tairo", url: "/chat", icon: MessageSquare },
  { title: "Achievements", url: "/achievements", icon: Trophy },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

const adminMenuItem = { title: "Admin", url: "/admin", icon: Shield };

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const isAdmin = user?.role === "admin";

  const allMenuItems = isAdmin ? [...menuItems, adminMenuItem] : menuItems;

  return (
    <Sidebar className="border-r-4 border-[hsl(var(--nav-accent))]">
      <SidebarHeader className="p-6 bg-gradient-to-b from-[hsl(var(--nav-bg-start))] to-[hsl(var(--nav-bg-end))]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg bg-[hsl(var(--nav-accent))] flex items-center justify-center">
            <Hourglass className="w-6 h-6 text-white" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20 rounded-lg"></div>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[hsl(var(--nav-foreground))]">Tfive</h2>
            <p className="text-xs text-[hsl(var(--nav-foreground))]/70">with Tairo AI</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-[hsl(var(--nav-bg-end))] to-[hsl(var(--nav-bg-start))]/95">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(var(--nav-foreground))]/60 font-semibold px-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "text-[hsl(var(--nav-foreground))] hover-elevate active-elevate-2 mx-2 rounded-lg",
                      location === item.url && "bg-[hsl(var(--nav-accent))] text-white font-semibold shadow-lg"
                    )}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.title}</span>
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
