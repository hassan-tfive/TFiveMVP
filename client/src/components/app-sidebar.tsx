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
    <Sidebar>
      <SidebarContent className="pb-96">
        <SidebarGroup>
          <SidebarGroupLabel className="font-semibold px-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "hover-elevate active-elevate-2 mx-2 rounded-lg",
                      location === item.url && "bg-primary text-primary-foreground font-semibold"
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
