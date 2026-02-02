// View modes
export type ViewMode = "matrix" | "kanban" | "list";

// Re-export frame types
export * from "./frames";

// Quadrant types for Matrix view
export type QuadrantId = "q1" | "q2" | "q3" | "q4";

// Status types for Kanban view
export type StatusId = "backlog" | "todo" | "doing" | "done";

// Item - Core data structure
export interface Item {
  id: string;
  content: string;
  quadrant: QuadrantId | null;
  status: StatusId | null;
}

// Page (Agenda/Topic)
export interface Page {
  id: string;
  title: string;
  items: Item[];
  status: "pending" | "doing" | "done";
}

// Meeting Log Entry
export interface LogEntry {
  id: string;
  timestamp: string;
  speaker: string;
  content: string;
  pageId: string;
}

// Quadrant definition
export interface QuadrantDef {
  id: QuadrantId;
  label: string;
  description: string;
  className: string;
}

// Kanban column definition
export interface KanbanColumnDef {
  id: StatusId;
  label: string;
  className: string;
}

// Constants
export const QUADRANTS: QuadrantDef[] = [
  {
    id: "q1",
    label: "Important & Urgent",
    description: "Do First",
    className: "bg-red-50 border-red-200",
  },
  {
    id: "q2",
    label: "Important & Not Urgent",
    description: "Schedule",
    className: "bg-blue-50 border-blue-200",
  },
  {
    id: "q3",
    label: "Not Important & Urgent",
    description: "Delegate",
    className: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "q4",
    label: "Not Important & Not Urgent",
    description: "Eliminate",
    className: "bg-gray-50 border-gray-200",
  },
];

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: "backlog", label: "Backlog", className: "bg-slate-50" },
  { id: "todo", label: "To Do", className: "bg-blue-50" },
  { id: "doing", label: "Doing", className: "bg-amber-50" },
  { id: "done", label: "Done", className: "bg-green-50" },
];
