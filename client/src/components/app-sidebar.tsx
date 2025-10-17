import { Home, Library, MessageSquare, Trophy, Shield, UserCircle } from "lucide-react";
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
import logoUrl from "@assets/v3 - crimson text font-03_1760641985520.png";

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
        <Link href="/" className="flex items-center justify-center group">
          <div className="relative px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm hover-elevate active-elevate-2">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--nav-accent))]/30 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
            <img src={logoUrl} alt="Tfive" className="h-10 w-auto relative z-10 cursor-pointer brightness-0 invert" data-testid="img-sidebar-logo" />
          </div>
        </Link>
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
