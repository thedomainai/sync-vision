"use client";

import { useState, useRef } from "react";
import { User, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WhiteboardFrame, StickyNote, StickyColor } from "@/types/frames";

interface WhiteboardProps {
  frame: WhiteboardFrame;
  className?: string;
  onNoteMove?: (noteId: string, x: number, y: number) => void;
}

const STICKY_COLORS: Record<StickyColor, string> = {
  yellow: "bg-yellow-200 border-yellow-400 shadow-yellow-200/50",
  blue: "bg-blue-200 border-blue-400 shadow-blue-200/50",
  green: "bg-green-200 border-green-400 shadow-green-200/50",
  pink: "bg-pink-200 border-pink-400 shadow-pink-200/50",
  orange: "bg-orange-200 border-orange-400 shadow-orange-200/50",
  purple: "bg-purple-200 border-purple-400 shadow-purple-200/50",
};

interface StickyNoteItemProps {
  note: StickyNote;
  onDragEnd: (x: number, y: number) => void;
}

function StickyNoteItem({ note, onDragEnd }: StickyNoteItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: note.x, y: note.y });
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: position.x,
      offsetY: position.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.offsetX + deltaX),
        y: Math.max(0, dragRef.current.offsetY + deltaY),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd(position.x, position.y);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={cn(
        "absolute p-3 rounded-md border-2 shadow-lg transition-shadow min-w-[120px] max-w-[200px]",
        STICKY_COLORS[note.color],
        isDragging && "shadow-xl scale-105 z-50 cursor-grabbing",
        !isDragging && "cursor-grab hover:shadow-xl"
      )}
      style={{
        left: position.x,
        top: position.y,
        width: note.width || "auto",
        transform: `rotate(${(parseInt(note.id.replace(/\D/g, ""), 10) % 5 - 2) * 2}deg)`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start gap-1 mb-1">
        <GripVertical className="h-4 w-4 text-gray-500 opacity-50 flex-shrink-0" />
        <p className="text-sm font-medium text-gray-800 leading-tight break-words">
          {note.content}
        </p>
      </div>
      {note.speaker && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mt-2 pt-1 border-t border-black/10">
          <User className="h-3 w-3" />
          {note.speaker}
        </div>
      )}
    </div>
  );
}

export function Whiteboard({ frame, className, onNoteMove }: WhiteboardProps) {
  const [notes, setNotes] = useState(frame.notes);

  const handleNoteMove = (noteId: string, x: number, y: number) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, x, y } : n))
    );
    onNoteMove?.(noteId, x, y);
  };

  if (!notes || notes.length === 0) {
    return (
      <div className={cn("p-8 text-center text-muted-foreground", className)}>
        <p>会話が始まると、ここに付箋が表示されます</p>
        <p className="text-sm mt-2">アイデアや意見が自動的に整理されます</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 px-4 pt-4">
        {frame.title}
      </h3>
      <div
        className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-dashed border-slate-300 overflow-hidden"
        style={{
          minHeight: frame.height,
          minWidth: "100%",
        }}
      >
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Sticky notes */}
        {notes.map((note) => (
          <StickyNoteItem
            key={note.id}
            note={note}
            onDragEnd={(x, y) => handleNoteMove(note.id, x, y)}
          />
        ))}
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-3 mt-4 px-4 pb-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400" />
          アイデア
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-200 border border-blue-400" />
          質問
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 border border-green-400" />
          解決策
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-pink-200 border border-pink-400" />
          問題点
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-200 border border-orange-400" />
          重要
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-200 border border-purple-400" />
          要検討
        </span>
      </div>
    </div>
  );
}
