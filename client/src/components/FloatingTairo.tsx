import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import tairoCharacterUrl from "@assets/generated_images/Friendly_AI_coach_character_f4c04a5a.png";

interface FloatingTairoProps {
  isTalking?: boolean;
  isThinking?: boolean;
  className?: string;
}

export function FloatingTairo({ 
  isTalking = false, 
  isThinking = false,
  className 
}: FloatingTairoProps) {
  const { workspace } = useWorkspace();
  const [position, setPosition] = useState({ x: 20, y: 20 });

  // Gentle floating movement
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(30, prev.x + (Math.random() - 0.5) * 10)),
        y: Math.max(0, Math.min(30, prev.y + (Math.random() - 0.5) * 10))
      }));
    }, 3000);

    return () => clearInterval(moveInterval);
  }, []);

  return (
    <div 
      className={cn(
        "fixed pointer-events-none z-50 transition-all duration-[3000ms] ease-in-out",
        className
      )}
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
    >
      <div className="relative" style={{ pointerEvents: 'none' }}>
        {/* Character image */}
        <div 
          className={cn(
            "relative w-48 h-64 rounded-2xl overflow-hidden shadow-2xl border-4 transition-all duration-500",
            workspace === "professional" 
              ? "border-workspace-professional" 
              : "border-workspace-personal",
            isThinking && "animate-bounce",
            isTalking && "animate-pulse"
          )}
        >
          <img 
            src={tairoCharacterUrl} 
            alt="Tairo - Your AI Companion"
            className="w-full h-full object-cover"
            style={{
              animation: 'gentle-sway 6s ease-in-out infinite'
            }}
          />
          
          {/* Gradient overlay for workspace theming */}
          <div className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            workspace === "professional"
              ? "bg-gradient-to-t from-workspace-professional/30 to-transparent"
              : "bg-gradient-to-t from-workspace-personal/30 to-transparent"
          )} />
        </div>

        {/* Status indicator */}
        {(isThinking || isTalking) && (
          <div className={cn(
            "absolute -top-3 -right-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg border-2 border-background flex items-center gap-2 pointer-events-auto",
            workspace === "professional"
              ? "bg-workspace-professional text-white"
              : "bg-workspace-personal text-white"
          )}>
            {isThinking ? (
              <>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Thinking...</span>
              </>
            ) : isTalking ? (
              <>
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-white rounded-full" style={{ animation: 'wave 1s ease-in-out infinite' }} />
                  <div className="w-1 h-3 bg-white rounded-full" style={{ animation: 'wave 1s ease-in-out infinite 200ms' }} />
                  <div className="w-1 h-3 bg-white rounded-full" style={{ animation: 'wave 1s ease-in-out infinite 400ms' }} />
                </div>
                <span>Speaking</span>
              </>
            ) : null}
          </div>
        )}

        {/* Breathing glow effect */}
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl blur-xl",
            workspace === "professional"
              ? "bg-workspace-professional"
              : "bg-workspace-personal"
          )} 
          style={{ 
            zIndex: -1,
            animation: 'breathe-glow 4s ease-in-out infinite',
            pointerEvents: 'none'
          }} 
        />
      </div>
    </div>
  );
}
