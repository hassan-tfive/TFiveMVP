import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface TairoAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  isThinking?: boolean;
  isTalking?: boolean;
  className?: string;
}

export function TairoAvatar({ 
  size = "md", 
  isThinking = false,
  isTalking = false,
  className 
}: TairoAvatarProps) {
  const { workspace } = useWorkspace();
  const [blink, setBlink] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  const sizeMap = {
    sm: { width: 60, height: 80 },
    md: { width: 80, height: 100 },
    lg: { width: 120, height: 160 },
    xl: { width: 200, height: 260 },
  };

  const { width, height } = sizeMap[size];

  const colors = workspace === "professional"
    ? {
        primary: "hsl(235, 100%, 20%)",
        accent: "hsl(40, 90%, 55%)",
        skin: "hsl(30, 50%, 75%)",
        clothes: "hsl(235, 100%, 15%)",
      }
    : {
        primary: "hsl(266, 73%, 40%)",
        accent: "hsl(318, 100%, 50%)",
        skin: "hsl(30, 50%, 75%)",
        clothes: "hsl(266, 73%, 35%)",
      };

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, Math.random() * 3000 + 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Talking animation
  useEffect(() => {
    if (isTalking) {
      const talkInterval = setInterval(() => {
        setMouthFrame((prev) => (prev + 1) % 3);
      }, 200);
      return () => clearInterval(talkInterval);
    } else {
      setMouthFrame(0);
    }
  }, [isTalking]);

  const getMouthPath = () => {
    if (!isTalking) {
      return "M 40 60 Q 50 65 60 60"; // Smile
    }
    
    // Three mouth positions for talking animation
    const mouths = [
      "M 40 60 Q 50 68 60 60", // Open
      "M 42 58 Q 50 64 58 58", // Mid
      "M 40 60 Q 50 65 60 60", // Closed
    ];
    return mouths[mouthFrame];
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 130"
        className={cn(
          "transition-transform duration-300",
          isThinking && "animate-bounce"
        )}
      >
        <defs>
          <linearGradient id={`avatar-gradient-${workspace}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
        </defs>

        {/* Animated group with breathing effect */}
        <g className="animate-[breathe_4s_ease-in-out_infinite]">
          {/* Body/Torso */}
          <rect
            x="20"
            y="65"
            width="60"
            height="60"
            rx="10"
            fill={colors.clothes}
            opacity="0.9"
          />

          {/* Neck */}
          <path
            d="M 30 65 Q 50 55 70 65"
            fill={colors.clothes}
            stroke={colors.primary}
            strokeWidth="2"
          />

          {/* Head */}
          <circle
            cx="50"
            cy="35"
            r="22"
            fill={colors.skin}
            stroke={colors.primary}
            strokeWidth="2"
          />

          {/* Eyes */}
          <ellipse
            cx="42"
            cy="32"
            rx="3"
            ry={blink ? 1 : 4}
            fill={colors.primary}
            className="transition-all duration-150"
          />
          <ellipse
            cx="58"
            cy="32"
            rx="3"
            ry={blink ? 1 : 4}
            fill={colors.primary}
            className="transition-all duration-150"
          />

          {/* Eyebrows */}
          <path
            d="M 30 22 Q 28 18 32 16"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 70 22 Q 72 18 68 16"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Mouth - animated when talking */}
          <path
            d={getMouthPath()}
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-200"
          />

          {/* Shirt buttons */}
          <circle
            cx="50"
            cy="80"
            r="4"
            fill={colors.accent}
            opacity="0.8"
          />
          <circle
            cx="50"
            cy="90"
            r="4"
            fill={colors.accent}
            opacity="0.8"
          />
          <circle
            cx="50"
            cy="100"
            r="4"
            fill={colors.accent}
            opacity="0.8"
          />
        </g>

        {/* Thinking sparkle */}
        {isThinking && (
          <g className="animate-pulse" opacity="0.8">
            <circle cx="75" cy="20" r="8" fill={colors.accent} opacity="0.3" />
            <circle cx="75" cy="20" r="4" fill={colors.accent} />
          </g>
        )}
      </svg>

      {/* Thinking label */}
      {isThinking && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <span className="animate-pulse">Thinking</span>
          <span className="flex gap-0.5">
            <span className="animate-[bounce_1s_infinite_0ms]">.</span>
            <span className="animate-[bounce_1s_infinite_200ms]">.</span>
            <span className="animate-[bounce_1s_infinite_400ms]">.</span>
          </span>
        </div>
      )}
    </div>
  );
}
