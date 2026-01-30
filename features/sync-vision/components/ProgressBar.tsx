"use client";

import { Check, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/types";

interface ProgressBarProps {
  pages: Page[];
  activePageId: string;
  onPageClick: (pageId: string) => void;
}

export function ProgressBar({
  pages,
  activePageId,
  onPageClick,
}: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 px-6 bg-white border-b">
      {pages.map((page, index) => {
        const isActive = page.id === activePageId;
        const isDone = page.status === "done";

        return (
          <div key={page.id} className="flex items-center">
            <button
              onClick={() => onPageClick(page.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                isActive && "bg-primary text-primary-foreground scale-105",
                !isActive && isDone && "bg-green-100 text-green-700",
                !isActive && !isDone && "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {isDone ? (
                <Check className="h-4 w-4" />
              ) : isActive ? (
                <PlayCircle className="h-4 w-4 animate-pulse" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isActive ? "Doing Now: " : ""}
                {page.title}
              </span>
            </button>

            {index < pages.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-2",
                  isDone ? "bg-green-300" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
