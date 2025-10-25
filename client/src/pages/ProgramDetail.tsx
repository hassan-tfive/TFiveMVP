import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones, BookOpen, Brain, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Loop, ContentItem } from "@shared/schema";

export default function ProgramDetail() {
  const { loopId } = useParams<{ loopId: string }>();
  const [, setLocation] = useLocation();
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  const { data: loop, isLoading } = useQuery<Loop>({
    queryKey: ["/api/loops", loopId],
    queryFn: async () => {
      const res = await fetch(`/api/loops/${loopId}`);
      if (!res.ok) throw new Error("Failed to fetch loop");
      return res.json();
    },
    enabled: !!loopId,
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-background overflow-y-auto">
        <div className="p-6 border-b">
          <Link href="/programs">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-programs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold font-display">{loop.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{loop.durLearn + loop.durAct + loop.durEarn} min total</span>
          </div>
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Beau</h3>
                  <p className="text-muted-foreground">
                    {typeof selectedContent.content === "string" 
                      ? selectedContent.content 
                      : JSON.stringify(selectedContent.content, null, 2)}
                  </p>
                </div>
              ) : selectedContent.type === "deep_dive" || selectedContent.type === "key_takeaways" ? (
                <div className="space-y-4">
                  <div className="text-base leading-relaxed">
                    {typeof selectedContent.content === "string" 
                      ? selectedContent.content 
                      : JSON.stringify(selectedContent.content, null, 2)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(selectedContent.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t">
              <Button onClick={() => setLocation(`/session/${loopId}`)} data-testid="button-start-session">
                Start Session
              </Button>
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
