import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Headphones, BookOpen, Brain, CheckCircle, Clock, Play, Pause, PartyPopper, Zap, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Quiz } from "@/components/Quiz";
import { getProgramTypeConfig } from "@shared/programTypes";
import type { Loop, ContentItem } from "@shared/schema";

export default function ProgramDetail() {
  const { loopId } = useParams<{ loopId: string }>();
  const [, setLocation] = useLocation();
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"learn" | "act" | "earn">("learn");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [readingMode, setReadingMode] = useState<"quick" | "deep">("quick");

  const { data: loop, isLoading } = useQuery<Loop>({
    queryKey: ["/api/loops", loopId],
    queryFn: async () => {
      const res = await fetch(`/api/loops/${loopId}`);
      if (!res.ok) throw new Error("Failed to fetch loop");
      return res.json();
    },
    enabled: !!loopId,
  });

  // Timer effect
  useEffect(() => {
    if (!sessionActive || isPaused) return;
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next phase or end session
          if (currentPhase === "learn" && loop) {
            setCurrentPhase("act");
            return loop.durAct * 60;
          } else if (currentPhase === "act" && loop) {
            setCurrentPhase("earn");
            return loop.durEarn * 60;
          } else {
            // Session complete
            setSessionActive(false);
            setSessionComplete(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [sessionActive, isPaused, currentPhase, loop]);

  const startSession = () => {
    if (!loop) return;
    setSessionActive(true);
    setSessionComplete(false);
    setCurrentPhase("learn");
    setTimeRemaining(loop.durLearn * 60);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPhaseColor = (phase: "learn" | "act" | "earn") => {
    switch (phase) {
      case "learn": return "bg-timer-learn";
      case "act": return "bg-timer-act";
      case "earn": return "bg-timer-earn";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r bg-muted/30 animate-pulse" />
        <div className="flex-1 animate-pulse bg-muted/20" />
      </div>
    );
  }

  if (!loop) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Program not found</h1>
          <Button onClick={() => setLocation("/programs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Programs
          </Button>
        </div>
      </div>
    );
  }

  const contentItems = loop.contentItems as ContentItem[] || [];
  
  // Group content items by section
  const learnListening = contentItems.filter(
    item => item.section === "learn" && (item.type === "podcast" || item.type === "lecture")
  );
  const learnReading = contentItems.filter(
    item => item.section === "learn" && (item.type === "deep_dive" || item.type === "key_takeaways" || item.type === "faq")
  );
  const learnInteracting = contentItems.filter(
    item => item.section === "learn" && (item.type === "quiz_multiple_choice" || item.type === "quiz_true_false" || item.type === "word_quest" || item.type === "flashcards")
  );

  const selectedContent = selectedContentId
    ? contentItems.find(item => item.id === selectedContentId)
    : null;

  const getContentIcon = (type: string) => {
    switch (type) {
      case "podcast":
      case "lecture":
        return <Headphones className="w-4 h-4" />;
      case "deep_dive":
      case "key_takeaways":
      case "faq":
        return <BookOpen className="w-4 h-4" />;
      case "quiz_multiple_choice":
      case "quiz_true_false":
      case "word_quest":
      case "flashcards":
        return <Brain className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const formatDuration = (duration: number) => {
    if (duration < 1) return `${Math.round(duration * 60)} sec`;
    return `${duration} min ${duration >= 1 ? (duration === 1 ? 'read' : 'read') : ''}`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "podcast": return "Podcast Episode";
      case "lecture": return "Lecture Recording";
      case "deep_dive": return "Deep Dive";
      case "key_takeaways": return "Key Takeaways";
      case "faq": return "Frequently Asked Questions";
      case "quiz_multiple_choice": return "Multiple Choice Quiz";
      case "quiz_true_false": return "True or False Quiz";
      case "word_quest": return "Word Quest";
      case "flashcards": return "Flashcards";
      default: return type;
    }
  };

  // Helper to get reading content based on mode
  const getReadingContent = (content: unknown, mode: "quick" | "deep"): { text: string; isFormatted: boolean } => {
    if (typeof content === "string") {
      // If content is just a string, generate quick version by taking first ~30%
      if (mode === "quick") {
        const words = content.split(" ");
        const quickLength = Math.ceil(words.length * 0.3);
        const wasTruncated = quickLength < words.length;
        const truncated = words.slice(0, quickLength).join(" ");
        return { 
          text: wasTruncated ? truncated + "..." : truncated, 
          isFormatted: false 
        };
      }
      return { text: content, isFormatted: false };
    }
    
    // If content is an object with quick/deep properties
    if (typeof content === "object" && content !== null) {
      const contentObj = content as { quick?: string; deep?: string; [key: string]: unknown };
      if (mode === "quick" && contentObj.quick) {
        return { text: contentObj.quick, isFormatted: false };
      }
      if (mode === "deep" && contentObj.deep) {
        return { text: contentObj.deep, isFormatted: false };
      }
      // Fallback: if only one version exists, use it
      if (contentObj.quick) return { text: contentObj.quick, isFormatted: false };
      if (contentObj.deep) return { text: contentObj.deep, isFormatted: false };
      
      // If no quick/deep fields, return formatted JSON
      return { text: JSON.stringify(content, null, 2), isFormatted: true };
    }
    
    return { text: JSON.stringify(content, null, 2), isFormatted: true };
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background overflow-y-auto">
        <div className="p-6 border-b space-y-4">
          <Link href="/programs">
            <Button variant="ghost" size="sm" data-testid="button-back-programs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold font-display">{loop.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {getProgramTypeConfig(loop.programType).label}
              </Badge>
            </div>
            {!sessionActive && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{loop.durLearn + loop.durAct + loop.durEarn} min total</span>
              </div>
            )}
          </div>

          {/* Session Timer or Start Button */}
          {sessionComplete ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg text-center bg-green-500">
                <PartyPopper className="w-8 h-8 mx-auto text-white mb-2" />
                <div className="text-sm font-semibold text-white mb-1">
                  Session Complete!
                </div>
                <div className="text-xs text-white/80">
                  Great work! You've completed all phases.
                </div>
              </div>
              <Button
                onClick={startSession}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-restart-session"
              >
                <Play className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
            </div>
          ) : sessionActive ? (
            <div className="space-y-3">
              <div className={cn("p-4 rounded-lg text-center", getPhaseColor(currentPhase))}>
                <div className="text-xs uppercase tracking-wider text-white/80 mb-1">
                  {currentPhase === "learn" ? "Learn" : currentPhase === "act" ? "Act" : "Earn"} Phase
                </div>
                <div className="text-3xl font-bold text-white font-mono">
                  {formatTime(timeRemaining)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePause}
                className="w-full"
                data-testid="button-pause-session"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <div className="flex-1 text-center">
                  <div className="font-medium">{loop.durLearn}m</div>
                  <div>Learn</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="font-medium">{loop.durAct}m</div>
                  <div>Act</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="font-medium">{loop.durEarn}m</div>
                  <div>Earn</div>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={startSession}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-start-session"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          )}
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground italic">
            Everyone learns differently so I've generated multiple ways to explore this subject:
          </p>

          {/* Learn by Listening */}
          {learnListening.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium italic">Learn by Listening</h3>
              <div className="space-y-1">
                {learnListening.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedContentId(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-md text-sm transition-colors hover-elevate",
                      selectedContentId === item.id ? "bg-accent" : "bg-background"
                    )}
                    data-testid={`button-content-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getContentIcon(item.type)}
                      <span>{getTypeLabel(item.type)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.duration} min listen
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Learn by Reading */}
          {learnReading.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium italic">Learn by Reading</h3>
              <div className="space-y-1">
                {learnReading.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedContentId(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-md text-sm transition-colors hover-elevate",
                      selectedContentId === item.id ? "bg-accent" : "bg-background"
                    )}
                    data-testid={`button-content-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getContentIcon(item.type)}
                      <span>{getTypeLabel(item.type)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(item.duration)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Learn by Interacting */}
          {learnInteracting.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium italic">Learn by Interacting</h3>
              <div className="space-y-1">
                {learnInteracting.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedContentId(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-md text-sm transition-colors hover-elevate",
                      selectedContentId === item.id ? "bg-accent" : "bg-background"
                    )}
                    data-testid={`button-content-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getContentIcon(item.type)}
                      <span>{getTypeLabel(item.type)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.duration} min test
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {contentItems.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p>No structured content available yet.</p>
              <p className="mt-2">This program uses the classic format.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        {selectedContent ? (
          <div className="max-w-3xl mx-auto p-12">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {getContentIcon(selectedContent.type)}
                <h2 className="text-2xl font-semibold font-display">
                  {getTypeLabel(selectedContent.type)}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground italic">
                {selectedContent.title}
              </p>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              {selectedContent.type === "podcast" || selectedContent.type === "lecture" ? (
                <div className="space-y-6">
                  <AudioPlayer 
                    title={selectedContent.title}
                    audioUrl={typeof selectedContent.content === "object" && selectedContent.content && "audioUrl" in selectedContent.content ? selectedContent.content.audioUrl as string : undefined}
                  />
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">About this {selectedContent.type === "podcast" ? "Podcast" : "Lecture"}</h3>
                    <p className="text-muted-foreground">
                      {typeof selectedContent.content === "string" 
                        ? selectedContent.content 
                        : typeof selectedContent.content === "object" && selectedContent.content && "description" in selectedContent.content
                        ? selectedContent.content.description as string
                        : "Audio content for your learning journey"}
                    </p>
                  </div>
                </div>
              ) : selectedContent.type === "deep_dive" || selectedContent.type === "key_takeaways" ? (
                <div className="space-y-6">
                  {/* Reading Mode Toggle */}
                  <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-lg w-fit mx-auto">
                    <Button
                      variant={readingMode === "quick" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setReadingMode("quick")}
                      className="gap-2"
                      data-testid="button-reading-mode-quick"
                    >
                      <Zap className="w-4 h-4" />
                      Quick Read
                    </Button>
                    <Button
                      variant={readingMode === "deep" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setReadingMode("deep")}
                      className="gap-2"
                      data-testid="button-reading-mode-deep"
                    >
                      <BookMarked className="w-4 h-4" />
                      Deep Read
                    </Button>
                  </div>

                  {/* Reading Content */}
                  {(() => {
                    const content = getReadingContent(selectedContent.content, readingMode);
                    return content.isFormatted ? (
                      <pre className="text-sm bg-muted p-4 rounded-md overflow-auto whitespace-pre-wrap">
                        {content.text}
                      </pre>
                    ) : (
                      <div className="text-base leading-relaxed whitespace-pre-wrap">
                        {content.text}
                      </div>
                    );
                  })()}

                  {/* Reading Mode Info */}
                  <div className="text-sm text-muted-foreground italic text-center">
                    {readingMode === "quick" 
                      ? "Quick Read: Get the essentials in less time" 
                      : "Deep Read: Explore the full content for deeper understanding"}
                  </div>
                </div>
              ) : selectedContent.type === "quiz_multiple_choice" || selectedContent.type === "quiz_true_false" ? (
                <Quiz
                  title={selectedContent.title}
                  questions={(() => {
                    // Parse quiz content - expect { questions: [...] } or array of questions
                    const content = selectedContent.content;
                    if (Array.isArray(content)) {
                      return content;
                    }
                    if (typeof content === "object" && content && "questions" in content) {
                      return (content as { questions: unknown[] }).questions;
                    }
                    return [];
                  })()}
                  type={selectedContent.type === "quiz_multiple_choice" ? "multiple_choice" : "true_false"}
                  onComplete={(score, total) => {
                    console.log(`Quiz completed: ${score}/${total}`);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(selectedContent.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a content item to begin</p>
              <p className="text-sm mt-2">Choose from the sidebar to explore different ways to learn</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
