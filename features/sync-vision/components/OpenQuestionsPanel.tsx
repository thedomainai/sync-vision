"use client";

import { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenQuestion } from "@/types/frames";

interface OpenQuestionsPanelProps {
  questions: OpenQuestion[];
  onToggleResolved?: (questionId: string) => void;
  className?: string;
}

interface QuestionCardProps {
  question: OpenQuestion;
  onToggleResolved?: (questionId: string) => void;
}

function QuestionCard({ question, onToggleResolved }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        question.resolved
          ? "bg-green-50 border-green-200 opacity-60"
          : "bg-white border-amber-200"
      )}
    >
      {/* Header */}
      <div
        className="flex items-start gap-2 p-3 cursor-pointer hover:bg-gray-50/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleResolved?.(question.id);
          }}
          className="mt-0.5 flex-shrink-0"
        >
          {question.resolved ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-amber-500" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium text-sm",
              question.resolved && "line-through text-gray-500"
            )}
          >
            {question.question}
          </p>
          {question.speaker && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <User className="h-3 w-3" />
              {question.speaker}
            </div>
          )}
        </div>

        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && !question.resolved && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
          {/* Current Understanding */}
          {question.currentUnderstanding && (
            <div className="flex gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-700">わかっていること</p>
                <p className="text-xs text-gray-600">{question.currentUnderstanding}</p>
              </div>
            </div>
          )}

          {/* Information Needed */}
          {question.informationNeeded && (
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700">回答が必要</p>
                <p className="text-xs text-gray-600">{question.informationNeeded}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function OpenQuestionsPanel({
  questions,
  onToggleResolved,
  className,
}: OpenQuestionsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const unresolvedCount = questions.filter((q) => !q.resolved).length;
  const resolvedCount = questions.filter((q) => q.resolved).length;

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className={cn("border-t bg-amber-50/50", className)}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-3 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-sm text-amber-800">
            残論点
          </span>
          {unresolvedCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unresolvedCount}
            </span>
          )}
          {resolvedCount > 0 && (
            <span className="text-xs text-gray-500">
              ({resolvedCount} 解決済み)
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Questions list */}
      {!isCollapsed && (
        <div className="p-3 pt-0 space-y-2 max-h-[300px] overflow-y-auto">
          {/* Unresolved questions first */}
          {questions
            .filter((q) => !q.resolved)
            .map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onToggleResolved={onToggleResolved}
              />
            ))}

          {/* Resolved questions */}
          {questions
            .filter((q) => q.resolved)
            .map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onToggleResolved={onToggleResolved}
              />
            ))}
        </div>
      )}
    </div>
  );
}
