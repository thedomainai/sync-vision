"use client";

import { cn } from "@/lib/utils";
import { QUADRANTS, type Item, type QuadrantId } from "@/types";
import { ItemCard } from "./ItemCard";

interface MatrixViewProps {
  items: Item[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDrop: (quadrantId: QuadrantId) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function MatrixView({
  items,
  onDragStart,
  onDrop,
  onDragOver,
}: MatrixViewProps) {
  const getItemsForQuadrant = (quadrantId: QuadrantId) =>
    items.filter((item) => item.quadrant === quadrantId);

  return (
    <div className="h-full flex flex-col">
      {/* Axis Labels */}
      <div className="grid grid-cols-[auto_1fr_1fr] gap-2 mb-2">
        <div className="w-8" />
        <div className="text-center text-sm font-medium text-muted-foreground">
          Urgent
        </div>
        <div className="text-center text-sm font-medium text-muted-foreground">
          Not Urgent
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 grid grid-cols-[auto_1fr_1fr] grid-rows-2 gap-2">
        {/* Important Label */}
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground -rotate-90 whitespace-nowrap">
            Important
          </span>
        </div>

        {/* Q1: Important & Urgent */}
        <QuadrantCell
          quadrant={QUADRANTS[0]}
          items={getItemsForQuadrant("q1")}
          onDragStart={onDragStart}
          onDrop={() => onDrop("q1")}
          onDragOver={onDragOver}
        />

        {/* Q2: Important & Not Urgent */}
        <QuadrantCell
          quadrant={QUADRANTS[1]}
          items={getItemsForQuadrant("q2")}
          onDragStart={onDragStart}
          onDrop={() => onDrop("q2")}
          onDragOver={onDragOver}
        />

        {/* Not Important Label */}
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground -rotate-90 whitespace-nowrap">
            Not Important
          </span>
        </div>

        {/* Q3: Not Important & Urgent */}
        <QuadrantCell
          quadrant={QUADRANTS[2]}
          items={getItemsForQuadrant("q3")}
          onDragStart={onDragStart}
          onDrop={() => onDrop("q3")}
          onDragOver={onDragOver}
        />

        {/* Q4: Not Important & Not Urgent */}
        <QuadrantCell
          quadrant={QUADRANTS[3]}
          items={getItemsForQuadrant("q4")}
          onDragStart={onDragStart}
          onDrop={() => onDrop("q4")}
          onDragOver={onDragOver}
        />
      </div>
    </div>
  );
}

interface QuadrantCellProps {
  quadrant: (typeof QUADRANTS)[number];
  items: Item[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}

function QuadrantCell({
  quadrant,
  items,
  onDragStart,
  onDrop,
  onDragOver,
}: QuadrantCellProps) {
  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragOver={onDragOver}
      className={cn(
        "rounded-lg border-2 p-3 min-h-[200px]",
        "transition-colors",
        quadrant.className
      )}
    >
      <div className="mb-2">
        <h3 className="font-medium text-sm">{quadrant.label}</h3>
        <p className="text-xs text-muted-foreground">{quadrant.description}</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}
