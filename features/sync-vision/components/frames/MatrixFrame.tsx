"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatrixFrame as MatrixFrameType, MatrixItem } from "@/types/frames";

interface MatrixFrameProps {
  frame: MatrixFrameType;
  className?: string;
}

interface QuadrantProps {
  label: string;
  items: MatrixItem[];
  className: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

function Quadrant({ label, items, className, position }: QuadrantProps) {
  const roundedClass = {
    "top-left": "rounded-tl-lg",
    "top-right": "rounded-tr-lg",
    "bottom-left": "rounded-bl-lg",
    "bottom-right": "rounded-br-lg",
  }[position];

  return (
    <div
      className={cn(
        "p-4 border min-h-[200px]",
        className,
        roundedClass
      )}
    >
      <h4 className="font-medium text-sm mb-3 text-gray-700">{label}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white/80 backdrop-blur-sm p-2 rounded border shadow-sm text-sm"
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
          <p className="text-xs text-gray-400 italic">まだ項目がありません</p>
        )}
      </div>
    </div>
  );
}

export function MatrixFrame({ frame, className }: MatrixFrameProps) {
  const q1Items = frame.items.filter((i) => i.quadrant === "q1");
  const q2Items = frame.items.filter((i) => i.quadrant === "q2");
  const q3Items = frame.items.filter((i) => i.quadrant === "q3");
  const q4Items = frame.items.filter((i) => i.quadrant === "q4");

  if (frame.items.length === 0) {
    return (
      <div className={cn("p-8 text-center text-muted-foreground", className)}>
        <p>会話が始まると、ここにマトリクスが表示されます</p>
      </div>
    );
  }

  return (
    <div className={cn("p-4", className)}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{frame.title}</h3>

      {/* Axis labels */}
      {frame.axisLabels && (
        <div className="relative mb-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{frame.axisLabels.xNegative}</span>
            <span>{frame.axisLabels.xPositive}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-0.5 bg-gray-200 rounded-lg overflow-hidden">
        {/* Top row: Q1 (top-left), Q2 (top-right) */}
        <Quadrant
          label={frame.labels.q1}
          items={q1Items}
          className="bg-red-50"
          position="top-left"
        />
        <Quadrant
          label={frame.labels.q2}
          items={q2Items}
          className="bg-blue-50"
          position="top-right"
        />

        {/* Bottom row: Q3 (bottom-left), Q4 (bottom-right) */}
        <Quadrant
          label={frame.labels.q3}
          items={q3Items}
          className="bg-yellow-50"
          position="bottom-left"
        />
        <Quadrant
          label={frame.labels.q4}
          items={q4Items}
          className="bg-gray-50"
          position="bottom-right"
        />
      </div>

      {/* Y-axis labels */}
      {frame.axisLabels && (
        <div className="flex flex-col items-start mt-2 text-xs text-gray-500">
          <span>{frame.axisLabels.yPositive} ↑</span>
          <span className="mt-auto">{frame.axisLabels.yNegative} ↓</span>
        </div>
      )}
    </div>
  );
}
