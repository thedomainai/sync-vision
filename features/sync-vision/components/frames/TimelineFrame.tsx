"use client";

import { User, Calendar, GitBranch, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TimelineFrame as TimelineFrameType,
  TimelineItem,
  TimelineCategory,
} from "@/types/frames";

interface TimelineFrameProps {
  frame: TimelineFrameType;
  className?: string;
}

interface CategoryColumnProps {
  category: TimelineCategory;
  items: TimelineItem[];
  isFirst: boolean;
  isLast: boolean;
}

function CategoryColumn({ category, items, isFirst, isLast }: CategoryColumnProps) {
  return (
    <div
      className={cn(
        "flex-1 min-w-[180px] p-3 border-r last:border-r-0 bg-white",
        isFirst && "rounded-l-lg",
        isLast && "rounded-r-lg"
      )}
    >
      <div className="mb-3 pb-2 border-b">
        <h4 className="font-medium text-sm text-gray-800">{category.label}</h4>
        {category.description && (
          <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
        )}
      </div>
      <div className="space-y-2 min-h-[150px]">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded border border-blue-100 shadow-sm text-sm"
          >
            <p className="text-gray-800">{item.content}</p>
            {item.speaker && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <User className="h-3 w-3" />
                {item.speaker}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center py-4">
            項目なし
          </p>
        )}
      </div>
    </div>
  );
}

function TimelineTypeIcon({ type }: { type: TimelineFrameType["timelineType"] }) {
  switch (type) {
    case "period":
      return <Calendar className="h-4 w-4" />;
    case "phase":
      return <GitBranch className="h-4 w-4" />;
    case "flow":
      return <Workflow className="h-4 w-4" />;
  }
}

function TimelineTypeLabel({ type }: { type: TimelineFrameType["timelineType"] }) {
  switch (type) {
    case "period":
      return "時期別";
    case "phase":
      return "フェーズ別";
    case "flow":
      return "フロー別";
  }
}

export function TimelineFrame({ frame, className }: TimelineFrameProps) {
  if (frame.items.length === 0 && frame.categories.length <= 3) {
    return (
      <div className={cn("p-8 text-center text-muted-foreground", className)}>
        <p>会話が始まると、ここにタイムラインが表示されます</p>
      </div>
    );
  }

  const getItemsForCategory = (categoryId: string) =>
    frame.items.filter((item) => item.categoryId === categoryId);

  return (
    <div className={cn("p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{frame.title}</h3>
        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <TimelineTypeIcon type={frame.timelineType} />
          <TimelineTypeLabel type={frame.timelineType} />
        </span>
      </div>

      {/* Timeline arrow indicator */}
      <div className="flex items-center mb-2 px-2">
        <div className="flex-1 h-1 bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400 rounded" />
        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-purple-400 ml-1" />
      </div>

      {/* Timeline columns */}
      <div className="flex overflow-x-auto gap-0.5 bg-gray-200 rounded-lg p-0.5">
        {frame.categories.map((category, index) => (
          <CategoryColumn
            key={category.id}
            category={category}
            items={getItemsForCategory(category.id)}
            isFirst={index === 0}
            isLast={index === frame.categories.length - 1}
          />
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>{frame.categories.length} カテゴリ</span>
        <span>{frame.items.length} 項目</span>
      </div>
    </div>
  );
}
