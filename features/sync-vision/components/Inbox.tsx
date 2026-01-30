"use client";

import { Inbox as InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";
import { ItemCard } from "./ItemCard";

interface InboxProps {
  items: Item[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function Inbox({ items, onDragStart, onDrop, onDragOver }: InboxProps) {
  const unassignedItems = items.filter(
    (item) => item.quadrant === null && item.status === null
  );

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragOver={onDragOver}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 min-h-[100px]",
        "bg-slate-50/50 transition-colors"
      )}
    >
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <InboxIcon className="h-4 w-4" />
        <span className="text-sm font-medium">
          Inbox ({unassignedItems.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {unassignedItems.map((item) => (
          <div key={item.id} className="w-full sm:w-auto sm:min-w-[200px]">
            <ItemCard item={item} onDragStart={onDragStart} />
          </div>
        ))}
        {unassignedItems.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Drop items here to unassign them
          </p>
        )}
      </div>
    </div>
  );
}
