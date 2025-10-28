import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl?: string;
  title: string;
  className?: string;
}

export function AudioPlayer({ audioUrl, title, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to play audio:", error);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 10, duration);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 10, 0);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // For demo purposes, use a placeholder if no audioUrl provided
  const demoAudioUrl = audioUrl || "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav";

  return (
    <div className={cn("bg-card border rounded-lg p-6 space-y-4", className)} data-testid="audio-player">
      <audio ref={audioRef} src={demoAudioUrl} preload="metadata" />
      
      <div>
        <h4 className="font-medium text-sm mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground">Audio Content</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
          data-testid="audio-progress-slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span data-testid="audio-current-time">{formatTime(currentTime)}</span>
          <span data-testid="audio-duration">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={skipBackward}
          aria-label="Skip backward 10 seconds"
          data-testid="button-skip-backward"
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={togglePlay}
          className="w-12 h-12"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          data-testid="button-play-pause"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={skipForward}
          aria-label="Skip forward 10 seconds"
          data-testid="button-skip-forward"
        >
          <SkipForward className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={cyclePlaybackRate}
          className="ml-4"
          aria-label={`Playback speed ${playbackRate}x`}
          data-testid="button-playback-rate"
        >
          {playbackRate}x
        </Button>
      </div>
    </div>
  );
}
