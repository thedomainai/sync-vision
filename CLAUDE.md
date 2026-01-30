# SyncVision - Coding Agent Guide

## Product Context

### Vision

Real-time meeting visualization tool to align mental models among participants. Visualize discussions in Matrix (4-quadrant) or Kanban views to resolve misalignment in understanding.

### Current Phase

| Phase | Status | Priority |
|-------|--------|----------|
| MVP Development | In Progress | Core functionality (views, D&D, multi-page) |

## Project Overview

A meeting facilitation web app built with Next.js 15, enabling real-time visualization and organization of discussion items.

## Quick Start

```bash
npm install
npm run dev
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | lucide-react |

## Directory Structure

```
facilitator/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page (SyncVision)
│   └── globals.css        # Global styles
├── components/            # Shared components
│   └── ui/               # shadcn/ui components
├── features/              # Feature modules
│   └── sync-vision/      # Main feature
│       ├── components/   # View components
│       └── hooks/        # Custom hooks
├── lib/                   # Utilities
│   └── utils.ts          # cn() helper
└── types/                 # TypeScript types
    └── index.ts          # Data models
```

## Data Models

### Item
```typescript
interface Item {
  id: string;
  content: string;
  quadrant: QuadrantId | null;  // Matrix view position
  status: StatusId | null;       // Kanban column
}
```

### Page (Agenda)
```typescript
interface Page {
  id: string;
  title: string;
  items: Item[];
  status: "pending" | "doing" | "done";
}
```

## Key Components

| Component | Description |
|-----------|-------------|
| `SyncVision` | Main container with all layouts |
| `MatrixView` | 4-quadrant Importance×Urgency view |
| `KanbanView` | Backlog→Todo→Doing→Done columns |
| `ListView` | Table view for all items |
| `ProgressBar` | Agenda progress indicator |
| `LeftSidebar` | Meeting log display |
| `RightSidebar` | Agenda/page navigation |
| `Inbox` | Unassigned items tray |

## Drag & Drop Behavior

- **Matrix View**: Updates `quadrant` property (q1-q4)
- **Kanban View**: Updates `status` property (backlog/todo/doing/done)
- **Inbox**: Clears both properties (null)

Important: Moving in one view preserves the other view's state.

## Adding New Features

1. Create components in `features/sync-vision/components/`
2. Add hooks in `features/sync-vision/hooks/`
3. Export from `features/sync-vision/index.ts`

## Git Workflow

### Branch Naming
```
<type>/<issue-number>-<short-description>
```

### Commit Format
```
<type>(<scope>): <description> (#<issue>)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```
