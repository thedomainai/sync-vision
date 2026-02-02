"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogicTreeFrame, TreeNode } from "@/types/frames";

interface LogicTreeProps {
  frame: LogicTreeFrame;
  className?: string;
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  isLast: boolean;
}

function TreeNodeItem({ node, level, isLast }: TreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const levelColors = [
    "bg-blue-100 border-blue-300 text-blue-900",
    "bg-green-100 border-green-300 text-green-900",
    "bg-amber-100 border-amber-300 text-amber-900",
    "bg-purple-100 border-purple-300 text-purple-900",
    "bg-pink-100 border-pink-300 text-pink-900",
  ];

  const colorClass = levelColors[level % levelColors.length];

  return (
    <div className="relative">
      {/* Connector lines */}
      {level > 0 && (
        <>
          {/* Horizontal line */}
          <div
            className="absolute top-4 -left-6 w-6 h-px bg-gray-300"
            style={{ left: "-24px" }}
          />
          {/* Vertical line */}
          {!isLast && (
            <div
              className="absolute top-4 -left-6 w-px bg-gray-300"
              style={{ left: "-24px", height: "calc(100% + 8px)" }}
            />
          )}
        </>
      )}

      {/* Node content */}
      <div className="flex items-start gap-2 mb-2">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <div
          className={cn(
            "flex-1 px-3 py-2 rounded-lg border-2 transition-all",
            colorClass,
            level === 0 && "font-semibold text-base",
            level > 0 && "text-sm"
          )}
        >
          <div className="flex items-center gap-2">
            <span>{node.content}</span>
            {node.speaker && (
              <span className="flex items-center gap-1 text-xs opacity-70">
                <User className="h-3 w-3" />
                {node.speaker}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-8 pl-4 border-l-2 border-gray-200">
          {node.children.map((child, index) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              isLast={index === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LogicTree({ frame, className }: LogicTreeProps) {
  if (!frame.nodes || frame.nodes.length === 0) {
    return (
      <div className={cn("p-8 text-center text-muted-foreground", className)}>
        <p>会話が始まると、ここにロジックツリーが表示されます</p>
      </div>
    );
  }

  return (
    <div className={cn("p-4", className)}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{frame.title}</h3>
      <div className="space-y-2">
        {frame.nodes.map((node, index) => (
          <TreeNodeItem
            key={node.id}
            node={node}
            level={0}
            isLast={index === frame.nodes.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
