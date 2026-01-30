"use client";

import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

interface ItemCardProps {
  item: Item;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDelete?: (itemId: string) => void;
  showDelete?: boolean;
}

export function ItemCard({
  item,
  onDragStart,
  onDelete,
  showDelete = false,
}: ItemCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      className={cn(
        "group flex items-center gap-2 rounded-md border bg-white p-3 shadow-sm",
        "cursor-grab active:cursor-grabbing",
        "hover:shadow-md transition-shadow"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="flex-1 text-sm">{item.content}</span>
      {showDelete && onDelete && (
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
