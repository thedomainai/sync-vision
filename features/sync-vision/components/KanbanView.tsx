"use client";

import { cn } from "@/lib/utils";
import { KANBAN_COLUMNS, type Item, type StatusId } from "@/types";
import { ItemCard } from "./ItemCard";

interface KanbanViewProps {
  items: Item[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDrop: (statusId: StatusId) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function KanbanView({
  items,
  onDragStart,
  onDrop,
  onDragOver,
}: KanbanViewProps) {
  const getItemsForColumn = (statusId: StatusId) =>
    items.filter((item) => item.status === statusId);

  return (
    <div className="h-full grid grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          items={getItemsForColumn(column.id)}
          onDragStart={onDragStart}
          onDrop={() => onDrop(column.id)}
          onDragOver={onDragOver}
        />
      ))}
    </div>
  );
}

interface KanbanColumnProps {
  column: (typeof KANBAN_COLUMNS)[number];
  items: Item[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

function KanbanColumn({
  column,
  items,
  onDragStart,
  onDrop,
  onDragOver,
}: KanbanColumnProps) {
  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragOver={onDragOver}
      className={cn(
        "rounded-lg border p-3 min-h-[400px] flex flex-col",
        column.className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">{column.label}</h3>
        <span className="text-xs text-muted-foreground bg-white/50 rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>
      <div className="flex-1 space-y-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}
