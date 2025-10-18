import { Home, Library, MessageSquare, Trophy, Shield, UserCircle, Circle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

const menuItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: Home,
    description: "Your overview"
  },
  { 
    title: "Programs", 
    url: "/programs", 
    icon: Circle,
    description: "Learning library",
    iconClassName: "fill-red-500 text-red-500"
  },
  { 
    title: "Chat with Tairo", 
    url: "/chat", 
    icon: MessageSquare,
    description: "AI guidance"
  },
  { 
    title: "Achievements", 
    url: "/achievements", 
    icon: Trophy,
    description: "Your progress"
  },
  { 
    title: "Profile", 
    url: "/profile", 
    icon: UserCircle,
    description: "Your settings"
  },
];

const adminMenuItem = { 
  title: "Admin", 
  url: "/admin", 
  icon: Shield,
  description: "Management"
};

export function AppSidebar() {
  const [location] = useLocation();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const isAdmin = user?.role === "admin";

  const allMenuItems = isAdmin ? [...menuItems, adminMenuItem] : menuItems;

  return (
    <Sidebar className="h-auto max-h-[98vh] rounded-lg overflow-visible">
      <SidebarContent className="rounded-lg p-4">
        <div className="space-y-3">
          {allMenuItems.map((item) => (
            <Link 
              key={item.title} 
              href={item.url}
              data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Card
                className={cn(
                  "p-4 cursor-pointer hover-elevate active-elevate-2 transition-all",
                  location === item.url && "bg-primary text-primary-foreground"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    location === item.url 
                      ? "bg-primary-foreground/20" 
                      : "bg-muted"
                  )}>
                    <item.icon className={cn("w-5 h-5", (item as any).iconClassName)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5">{item.title}</h3>
                    <p className={cn(
                      "text-xs",
                      location === item.url 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    )}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
