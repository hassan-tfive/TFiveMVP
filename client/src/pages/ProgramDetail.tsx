import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Headphones, BookOpen, Brain, CheckCircle, Clock, Play, Zap, BookMarked, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Quiz } from "@/components/Quiz";
import { GuidedActivity } from "@/components/GuidedActivity";
import { getProgramTypeConfig } from "@shared/programTypes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Loop, ContentItem } from "@shared/schema";

export default function ProgramDetail() {
  const { loopId } = useParams<{ loopId: string }>();
  const [, setLocation] = useLocation();
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState<"quick" | "deep">("quick");
  const [sessionStarted, setSessionStarted] = useState(false);
  const { toast } = useToast();

  const { data: loop, isLoading } = useQuery<Loop>({
    queryKey: ["/api/loops", loopId],
    queryFn: async () => {
      const res = await fetch(`/api/loops/${loopId}`);
      if (!res.ok) throw new Error("Failed to fetch loop");
      return res.json();
    },
    enabled: !!loopId,
  });

  // Mutation to start a session (mark program as in progress)
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!loopId) throw new Error("No loop ID");
      return await apiRequest(`/api/sessions/start`, {
        method: "POST",
        body: JSON.stringify({ loop_id: loopId }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      setSessionStarted(true);
      // Invalidate queries to update all relevant sections
      queryClient.invalidateQueries({ queryKey: ["/api/programs/started"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loops", loopId] });
      toast({
        title: "Session Started",
        description: "This program is now in your active sessions",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start session",
        variant: "destructive",
      });
    },
  });

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
  
  // Group content items by section (Learn, Act, Earn)
  const learnContent = contentItems.filter(item => item.section === "learn");
  const actContent = contentItems.filter(item => item.section === "act");
  const earnContent = contentItems.filter(item => item.section === "earn");

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
      case "guided_activity":
        return <Activity className="w-4 h-4" />;
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
      case "guided_activity": return "Guided Activity";
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
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{loop.durLearn + loop.durAct + loop.durEarn} min total</span>
            </div>
          </div>

          {/* Start Session Button */}
          {!sessionStarted ? (
            <Button
              onClick={() => startSessionMutation.mutate()}
              disabled={startSessionMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-start-session"
            >
              <Play className="w-4 h-4 mr-2" />
              {startSessionMutation.isPending ? "Starting..." : "Start Session"}
            </Button>
          ) : (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <CheckCircle className="w-5 h-5 mx-auto text-green-600 mb-1" />
              <div className="text-sm font-medium text-green-600">
                Session In Progress
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Explore the content below
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground italic">
            I've organized this session into Learn, Act, and Earn phases:
          </p>

          {/* Learn Section */}
          {learnContent.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-timer-learn">Learn</h3>
              <div className="space-y-1">
                {learnContent.map((item) => (
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
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.type === "podcast" || item.type === "lecture" ? `${item.duration} min` : formatDuration(item.duration)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Act Section */}
          {actContent.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-timer-act">Act</h3>
              <div className="space-y-1">
                {actContent.map((item) => (
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
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.duration} min
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Earn Section */}
          {earnContent.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-timer-earn">Earn</h3>
              <div className="space-y-1">
                {earnContent.map((item) => (
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
                      <span className="text-sm">{item.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.duration} min
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
              ) : selectedContent.type === "guided_activity" ? (
                <GuidedActivity
                  title={selectedContent.title}
                  type={(() => {
                    // Determine activity type from content or metadata
                    const content = selectedContent.content;
                    if (typeof content === "object" && content && "activityType" in content) {
                      return (content as { activityType: "breathing" | "movement" | "relaxation" }).activityType;
                    }
                    // Default based on content hints
                    if (selectedContent.title.toLowerCase().includes("breath")) return "breathing";
                    if (selectedContent.title.toLowerCase().includes("move")) return "movement";
                    return "relaxation";
                  })()}
                  description={(() => {
                    const content = selectedContent.content;
                    if (typeof content === "object" && content && "description" in content) {
                      return (content as { description: string }).description;
                    }
                    return undefined;
                  })()}
                  steps={(() => {
                    // Parse activity steps - expect { steps: [...] } or array
                    const content = selectedContent.content;
                    if (Array.isArray(content)) {
                      return content;
                    }
                    if (typeof content === "object" && content && "steps" in content) {
                      return (content as { steps: unknown[] }).steps;
                    }
                    return [];
                  })()}
                  totalDuration={selectedContent.duration}
                  onStart={() => {
                    // Mark program as in progress when user starts activity
                    if (!sessionStarted) {
                      startSessionMutation.mutate();
                    }
                  }}
                  onComplete={() => {
                    console.log("Guided activity completed");
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
