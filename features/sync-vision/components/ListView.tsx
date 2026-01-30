"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { QUADRANTS, KANBAN_COLUMNS, type Item } from "@/types";
import { Button } from "@/components/ui/button";

interface ListViewProps {
  items: Item[];
  onDelete: (itemId: string) => void;
}

export function ListView({ items, onDelete }: ListViewProps) {
  const getQuadrantLabel = (quadrantId: string | null) => {
    if (!quadrantId) return "-";
    const quadrant = QUADRANTS.find((q) => q.id === quadrantId);
    return quadrant?.label || "-";
  };

  const getStatusLabel = (statusId: string | null) => {
    if (!statusId) return "-";
    const column = KANBAN_COLUMNS.find((c) => c.id === statusId);
    return column?.label || "-";
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            <th className="text-left p-3 text-sm font-medium">Content</th>
            <th className="text-left p-3 text-sm font-medium w-48">Quadrant</th>
            <th className="text-left p-3 text-sm font-medium w-32">Status</th>
            <th className="w-16 p-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-muted-foreground">
                No items yet
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className="border-b hover:bg-muted/30 transition-colors"
              >
                <td className="p-3">{item.content}</td>
                <td className="p-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-1 rounded text-xs",
                      item.quadrant
                        ? QUADRANTS.find((q) => q.id === item.quadrant)
                            ?.className
                        : "bg-gray-100"
                    )}
                  >
                    {getQuadrantLabel(item.quadrant)}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-1 rounded text-xs",
                      item.status
                        ? KANBAN_COLUMNS.find((c) => c.id === item.status)
                            ?.className
                        : "bg-gray-100"
                    )}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
