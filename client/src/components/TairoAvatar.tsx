import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface TairoAvatarProps {
  size?: "sm" | "md" | "lg";
  isThinking?: boolean;
  className?: string;
}

export function TairoAvatar({ size = "md", isThinking = false, className }: TairoAvatarProps) {
  const { workspace } = useWorkspace();
  const [blink, setBlink] = useState(false);

  // Random blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, Math.random() * 4000 + 2000); // Blink every 2-6 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const eyeSize = {
    sm: 2,
    md: 3,
    lg: 4
  };

  const colors = workspace === "professional" 
    ? { primary: "#00042d", secondary: "#1e3a8a" } 
    : { primary: "#5c1cb2", secondary: "#ff00c1" };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Breathing/pulse animation background */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full opacity-20 animate-pulse",
          workspace === "professional" ? "bg-workspace-professional" : "bg-workspace-personal"
        )}
      />
      
      {/* Main avatar circle */}
      <div 
        className={cn(
          "relative w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all duration-300",
          workspace === "professional" 
            ? "bg-gradient-to-br from-workspace-professional to-workspace-professional-light" 
            : "bg-gradient-to-br from-workspace-personal to-workspace-personal-accent"
        )}
        style={{
          transform: isThinking ? "scale(1.1)" : "scale(1)",
        }}
      >
        {/* Simple friendly face SVG */}
        <svg
          viewBox="0 0 100 100"
          className={cn("w-full h-full transition-transform duration-200", isThinking && "animate-bounce")}
          style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)" }}
        >
          {/* Face */}
          <circle cx="50" cy="50" r="45" fill="white" opacity="0.95" />
          
          {/* Eyes */}
          <circle 
            cx="35" 
            cy="42" 
            r={eyeSize[size]} 
            fill={colors.primary}
            className={cn("transition-all", blink && "opacity-0")}
          />
          <circle 
            cx="65" 
            cy="42" 
            r={eyeSize[size]} 
            fill={colors.primary}
            className={cn("transition-all", blink && "opacity-0")}
          />
          
          {/* Smile */}
          <path
            d={isThinking 
              ? "M 30 55 Q 50 60 70 55" 
              : "M 30 55 Q 50 70 70 55"
            }
            stroke={colors.secondary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          
          {/* Thinking dots when AI is processing */}
          {isThinking && (
            <g className="animate-pulse">
              <circle cx="40" cy="70" r="2" fill={colors.primary} opacity="0.6">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0s" />
              </circle>
              <circle cx="50" cy="70" r="2" fill={colors.primary} opacity="0.6">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.3s" />
              </circle>
              <circle cx="60" cy="70" r="2" fill={colors.primary} opacity="0.6">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" begin="0.6s" />
              </circle>
            </g>
          )}
        </svg>
      </div>

      {/* Sparkle effect when thinking */}
      {isThinking && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          <div className="w-3 h-3 rounded-full bg-primary absolute top-0" />
        </div>
      )}
    </div>
  );
}
