// Frame type definitions for realtime conversation analysis

export type FrameType = "matrix" | "logic-tree" | "whiteboard" | "timeline";

// ============================================
// 4-Quadrant Matrix (重要度×緊急度 / SWOT)
// ============================================
export interface MatrixItem {
  id: string;
  content: string;
  speaker?: string;
  quadrant: "q1" | "q2" | "q3" | "q4";
}

export interface MatrixFrame {
  type: "matrix";
  title: string;
  labels: {
    q1: string; // e.g., "重要 & 緊急" or "強み"
    q2: string; // e.g., "重要 & 非緊急" or "弱み"
    q3: string; // e.g., "非重要 & 緊急" or "機会"
    q4: string; // e.g., "非重要 & 非緊急" or "脅威"
  };
  axisLabels?: {
    xPositive: string;
    xNegative: string;
    yPositive: string;
    yNegative: string;
  };
  items: MatrixItem[];
}

// ============================================
// Logic Tree / Mind Map (階層構造)
// ============================================
export interface TreeNode {
  id: string;
  content: string;
  speaker?: string;
  children: TreeNode[];
  collapsed?: boolean;
}

export interface LogicTreeFrame {
  type: "logic-tree";
  title: string;
  rootLabel?: string;
  nodes: TreeNode[];
}

// ============================================
// Whiteboard + Sticky Notes (自由配置)
// ============================================
export type StickyColor = "yellow" | "blue" | "green" | "pink" | "orange" | "purple";

export interface StickyNote {
  id: string;
  content: string;
  speaker?: string;
  color: StickyColor;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface WhiteboardFrame {
  type: "whiteboard";
  title: string;
  notes: StickyNote[];
  width: number;
  height: number;
}

// ============================================
// Timeline View (時系列 / フェーズ / フロー)
// ============================================
export type TimelineType = "period" | "phase" | "flow";

export interface TimelineCategory {
  id: string;
  label: string;
  description?: string;
}

export interface TimelineItem {
  id: string;
  content: string;
  speaker?: string;
  categoryId: string;
}

export interface TimelineFrame {
  type: "timeline";
  title: string;
  timelineType: TimelineType;
  categories: TimelineCategory[];
  items: TimelineItem[];
}

// ============================================
// Union type for all frames
// ============================================
export type Frame = MatrixFrame | LogicTreeFrame | WhiteboardFrame | TimelineFrame;

// ============================================
// Open Questions (残論点)
// ============================================
export interface OpenQuestion {
  id: string;
  question: string;
  currentUnderstanding: string;
  informationNeeded: string;
  resolved: boolean;
  speaker?: string;
}

// ============================================
// Analysis result from Gemini
// ============================================
export interface RealtimeAnalysisResult {
  suggestedFrame: FrameType;
  frameReason: string;
  frame: Frame;
  summary: string;
  openQuestions: OpenQuestion[];
  lastProcessedText: string;
}

// ============================================
// Transcript segment for analysis
// ============================================
export interface TranscriptSegment {
  id: string;
  text: string;
  speaker?: string;
  timestamp: number;
  isFinal: boolean;
}
