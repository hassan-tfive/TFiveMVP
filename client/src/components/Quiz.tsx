import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trophy, ArrowRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number | boolean; // index for multiple choice, boolean for true/false
  explanation?: string;
}

interface QuizProps {
  title: string;
  questions: QuizQuestion[];
  type: "multiple_choice" | "true_false";
  onComplete?: (score: number, total: number) => void;
}

export function Quiz({ title, questions, type, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Guard against empty quiz
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4" data-testid="quiz-empty">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <Brain className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">No Questions Available</h3>
          <p className="text-muted-foreground">This quiz doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswerSelect = (answer: number | boolean) => {
    if (!hasAnswered) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setHasAnswered(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
      onComplete?.(score, questions.length);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  const isAnswerCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const scorePercentage = Math.round((score / questions.length) * 100);

  if (showResults) {
    return (
      <div className="space-y-6" data-testid="quiz-results">
        <div className="text-center space-y-4">
          <div className={cn(
            "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
            scorePercentage >= 70 ? "bg-green-500" : "bg-yellow-500"
          )}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-2">Quiz Complete!</h3>
            <p className="text-muted-foreground">You answered {score} out of {questions.length} questions correctly</p>
          </div>
          <div className="text-4xl font-bold">
            {scorePercentage}%
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRestart} data-testid="button-quiz-restart">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quiz-container">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          Question {currentQuestionIndex + 1} of {questions.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          Score: {score}/{currentQuestionIndex + (hasAnswered && isAnswerCorrect ? 1 : 0)}
        </div>
      </div>

      {/* Question */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold leading-relaxed" data-testid="quiz-question">
          {currentQuestion.question}
        </h3>

        {/* Answer Options */}
        <div className="space-y-2">
          {type === "true_false" ? (
            <>
              <button
                onClick={() => handleAnswerSelect(true)}
                disabled={hasAnswered}
                className={cn(
                  "w-full p-4 rounded-lg text-left transition-colors border-2",
                  !hasAnswered && "hover-elevate",
                  selectedAnswer === true && !hasAnswered && "border-primary bg-primary/10",
                  selectedAnswer === true && hasAnswered && isAnswerCorrect && "border-green-500 bg-green-500/10",
                  selectedAnswer === true && hasAnswered && !isAnswerCorrect && "border-red-500 bg-red-500/10",
                  selectedAnswer !== true && "border-border"
                )}
                data-testid="quiz-option-true"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">True</span>
                  {hasAnswered && selectedAnswer === true && (
                    isAnswerCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )
                  )}
                </div>
              </button>
              <button
                onClick={() => handleAnswerSelect(false)}
                disabled={hasAnswered}
                className={cn(
                  "w-full p-4 rounded-lg text-left transition-colors border-2",
                  !hasAnswered && "hover-elevate",
                  selectedAnswer === false && !hasAnswered && "border-primary bg-primary/10",
                  selectedAnswer === false && hasAnswered && isAnswerCorrect && "border-green-500 bg-green-500/10",
                  selectedAnswer === false && hasAnswered && !isAnswerCorrect && "border-red-500 bg-red-500/10",
                  selectedAnswer !== false && "border-border"
                )}
                data-testid="quiz-option-false"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">False</span>
                  {hasAnswered && selectedAnswer === false && (
                    isAnswerCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )
                  )}
                </div>
              </button>
            </>
          ) : (
            currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={hasAnswered}
                className={cn(
                  "w-full p-4 rounded-lg text-left transition-colors border-2",
                  !hasAnswered && "hover-elevate",
                  selectedAnswer === index && !hasAnswered && "border-primary bg-primary/10",
                  selectedAnswer === index && hasAnswered && isAnswerCorrect && "border-green-500 bg-green-500/10",
                  selectedAnswer === index && hasAnswered && !isAnswerCorrect && "border-red-500 bg-red-500/10",
                  hasAnswered && index === currentQuestion.correctAnswer && selectedAnswer !== index && "border-green-500 bg-green-500/5",
                  selectedAnswer !== index && !(hasAnswered && index === currentQuestion.correctAnswer) && "border-border"
                )}
                data-testid={`quiz-option-${index}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {hasAnswered && (
                    selectedAnswer === index ? (
                      isAnswerCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )
                    ) : index === currentQuestion.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : null
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Feedback */}
      {hasAnswered && (
        <div className={cn(
          "p-4 rounded-lg space-y-2",
          isAnswerCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
        )} data-testid="quiz-feedback">
          <div className="flex items-center gap-2">
            {isAnswerCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-green-700 dark:text-green-400">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-semibold text-red-700 dark:text-red-400">Incorrect</span>
              </>
            )}
          </div>
          {currentQuestion.explanation && (
            <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!hasAnswered ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="flex-1"
            data-testid="button-quiz-submit"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="flex-1"
            data-testid="button-quiz-next"
          >
            {isLastQuestion ? "See Results" : "Next Question"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
