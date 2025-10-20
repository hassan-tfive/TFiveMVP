import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { TairoGlowIcon, GrowthStepsIcon, FingerprintLinesIcon, EyeFrameIcon } from "@/components/CustomIcons";
import dashboardIcon from "@assets/generated_images/Grid_layout_dashboard_lines_3a6e475b.png";
import tairoAvatar from "@assets/generated_images/Modern_innovative_Tairo_avatar_6577fdec.png";
import achievementIcon from "@assets/generated_images/Modern_achievement_growth_icon_674335b9.png";
import profileIcon from "@assets/generated_images/Modern_profile_fingerprint_icon_7845f54d.png";
import adminIcon from "@assets/generated_images/Modern_admin_eye_icon_169abb78.png";
import programsIcon from "@assets/generated_images/Modern_pomodoro_productivity_icon_9fdad59d.png";

const menuItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: () => <img src={dashboardIcon} alt="Dashboard" className="w-16 h-16 object-contain" />,
    description: "Your overview"
  },
  { 
    title: "Programs", 
    url: "/programs", 
    icon: () => <img src={programsIcon} alt="Programs" className="w-16 h-16 object-contain" />,
    description: "Learning library"
  },
  { 
    title: "TAIRO", 
    url: "/chat", 
    icon: () => <img src={tairoAvatar} alt="Tairo" className="w-16 h-16 object-contain" />,
    description: "AI guidance"
  },
  { 
    title: "Achievements", 
    url: "/achievements", 
    icon: () => <img src={achievementIcon} alt="Achievements" className="w-16 h-16 object-contain" />,
    description: "Your progress"
  },
  { 
    title: "Profile", 
    url: "/profile", 
    icon: () => <img src={profileIcon} alt="Profile" className="w-16 h-16 object-contain" />,
    description: "Your settings"
  },
];

const adminMenuItem = { 
  title: "Admin", 
  url: "/admin", 
  icon: () => <img src={adminIcon} alt="Admin" className="w-16 h-16 object-contain" />,
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
                  "p-6 cursor-pointer hover-elevate active-elevate-2 transition-all",
                  location === item.url && "bg-primary text-primary-foreground"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    location === item.url 
                      ? "bg-primary-foreground/20" 
                      : "bg-muted"
                  )}>
                    {typeof item.icon === 'function' ? (
                      <item.icon />
                    ) : (
                      <item.icon className="w-16 h-16" />
                    )}
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
