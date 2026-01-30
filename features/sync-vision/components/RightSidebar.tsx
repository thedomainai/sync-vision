"use client";

import { FileText, Plus, Check, PlayCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Page } from "@/types";

interface RightSidebarProps {
  pages: Page[];
  activePageId: string;
  onPageClick: (pageId: string) => void;
  onAddPage: () => void;
  onTogglePageStatus: (pageId: string) => void;
}

export function RightSidebar({
  pages,
  activePageId,
  onPageClick,
  onAddPage,
  onTogglePageStatus,
}: RightSidebarProps) {
  return (
    <div className="w-64 bg-slate-50 border-l flex flex-col h-full">
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Agenda
        </h2>
        <Button variant="ghost" size="icon" onClick={onAddPage} className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          const isDone = page.status === "done";

          return (
            <div
              key={page.id}
              className={cn(
                "group flex items-center gap-2 p-3 rounded-lg mb-1 cursor-pointer transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-slate-200"
              )}
              onClick={() => onPageClick(page.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePageStatus(page.id);
                }}
                className={cn(
                  "flex-shrink-0",
                  isActive
                    ? "text-primary-foreground"
                    : isDone
                    ? "text-green-600"
                    : "text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <PlayCircle className="h-4 w-4 animate-pulse" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </button>
              <span className="flex-1 text-sm font-medium truncate">
                {page.title}
              </span>
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded",
                  isActive
                    ? "bg-primary-foreground/20"
                    : "bg-slate-200 text-muted-foreground"
                )}
              >
                {page.items.length}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
