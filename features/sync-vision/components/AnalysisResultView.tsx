"use client";

import { LayoutGrid, Columns, List, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AnalysisResult, AnalyzedTopic } from "@/lib/ai/gemini";

interface AnalysisResultViewProps {
  result: AnalysisResult;
  onApply: (topics: AnalyzedTopic[]) => void;
  onClose: () => void;
}

const FRAME_ICONS = {
  matrix: LayoutGrid,
  kanban: Columns,
  list: List,
};

const FRAME_LABELS = {
  matrix: "Matrix View",
  kanban: "Kanban View",
  list: "List View",
};

const QUADRANT_LABELS = {
  q1: "Important & Urgent",
  q2: "Important & Not Urgent",
  q3: "Not Important & Urgent",
  q4: "Not Important & Not Urgent",
};

const STATUS_LABELS = {
  backlog: "Backlog",
  todo: "To Do",
  doing: "Doing",
  done: "Done",
};

export function AnalysisResultView({
  result,
  onApply,
  onClose,
}: AnalysisResultViewProps) {
  const FrameIcon = (frame: keyof typeof FRAME_ICONS) => {
    const Icon = FRAME_ICONS[frame];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Analysis Results</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {result.overallSummary}
          </p>
        </div>

        <div className="p-4 flex-1 overflow-auto space-y-6">
          {result.topics.map((topic, index) => (
            <div
              key={topic.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Topic Header */}
              <div className="bg-slate-50 p-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        Topic {index + 1}
                      </span>
                      {topic.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {topic.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5">
                    {FrameIcon(topic.visualizationFrame)}
                    <span className="text-sm font-medium">
                      {FRAME_LABELS[topic.visualizationFrame]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Reason: {topic.frameReason}
                </p>
              </div>

              {/* Items */}
              <div className="p-4">
                <h4 className="text-sm font-medium mb-3">
                  Items ({topic.items.length})
                </h4>
                <div className="space-y-2">
                  {topic.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg text-sm"
                    >
                      <span className="flex-1">{item.content}</span>
                      {item.quadrant && (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs",
                          item.quadrant === "q1" && "bg-red-100 text-red-700",
                          item.quadrant === "q2" && "bg-blue-100 text-blue-700",
                          item.quadrant === "q3" && "bg-yellow-100 text-yellow-700",
                          item.quadrant === "q4" && "bg-gray-100 text-gray-700"
                        )}>
                          {QUADRANT_LABELS[item.quadrant]}
                        </span>
                      )}
                      {item.status && (
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs",
                          item.status === "done" && "bg-green-100 text-green-700",
                          item.status === "doing" && "bg-amber-100 text-amber-700",
                          item.status === "todo" && "bg-blue-100 text-blue-700",
                          item.status === "backlog" && "bg-slate-100 text-slate-700"
                        )}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        @{item.speaker}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Logs */}
              {topic.relatedLogs.length > 0 && (
                <div className="p-4 border-t bg-slate-50/50">
                  <h4 className="text-sm font-medium mb-2">
                    Related Discussion ({topic.relatedLogs.length} entries)
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {topic.relatedLogs.slice(0, 5).map((log, logIndex) => (
                      <div key={logIndex} className="text-xs text-muted-foreground">
                        <span className="font-mono">{log.timestamp}</span>
                        {" "}
                        <span className="font-medium text-primary">{log.speaker}</span>
                        : {log.content.slice(0, 100)}...
                      </div>
                    ))}
                    {topic.relatedLogs.length > 5 && (
                      <div className="text-xs text-muted-foreground italic">
                        +{topic.relatedLogs.length - 5} more entries
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {result.topics.length} topics extracted with{" "}
            {result.topics.reduce((acc, t) => acc + t.items.length, 0)} items
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onApply(result.topics)} className="gap-2">
              <Check className="h-4 w-4" />
              Apply to Workspace
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
