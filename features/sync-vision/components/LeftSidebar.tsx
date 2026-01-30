"use client";

import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/types";

interface LeftSidebarProps {
  logs: LogEntry[];
  activePageId: string;
  onLogClick: (pageId: string) => void;
}

export function LeftSidebar({
  logs,
  activePageId,
  onLogClick,
}: LeftSidebarProps) {
  return (
    <div className="w-72 bg-slate-50 border-r flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Meeting Log
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.map((log) => (
          <button
            key={log.id}
            onClick={() => onLogClick(log.pageId)}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-colors",
              log.pageId === activePageId
                ? "bg-primary/10 border-l-4 border-primary"
                : "bg-white hover:bg-slate-100"
            )}
          >
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {log.timestamp}
              </span>
              <div>
                <span className="text-sm font-medium text-primary">
                  {log.speaker}
                </span>
                <p className="text-sm text-foreground mt-1">{log.content}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
