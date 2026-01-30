"use client";

import { useState, useCallback } from "react";
import type { Page, Item, ViewMode, QuadrantId, StatusId, LogEntry } from "@/types";
import type { AnalyzedTopic } from "@/lib/ai/gemini";

// Initial mock data
const INITIAL_PAGES: Page[] = [
  {
    id: "p1",
    title: "Project Overview",
    status: "done",
    items: [
      { id: "101", content: "Define project scope", quadrant: "q1", status: "done" },
      { id: "102", content: "Set timeline", quadrant: "q2", status: "doing" },
    ],
  },
  {
    id: "p2",
    title: "Technical Requirements",
    status: "doing",
    items: [
      { id: "201", content: "API design review", quadrant: "q1", status: "todo" },
      { id: "202", content: "Database schema", quadrant: "q2", status: "backlog" },
      { id: "203", content: "Authentication flow", quadrant: null, status: null },
    ],
  },
  {
    id: "p3",
    title: "Next Steps",
    status: "pending",
    items: [
      { id: "301", content: "Assign tasks", quadrant: null, status: "todo" },
      { id: "302", content: "Schedule follow-up", quadrant: "q3", status: null },
    ],
  },
];

const INITIAL_LOGS: LogEntry[] = [
  { id: "l1", timestamp: "10:00", speaker: "Alice", content: "Let's start with the project overview", pageId: "p1" },
  { id: "l2", timestamp: "10:05", speaker: "Bob", content: "I think we need to prioritize the API design", pageId: "p2" },
  { id: "l3", timestamp: "10:10", speaker: "Alice", content: "Good point, let's add it to Q1", pageId: "p2" },
  { id: "l4", timestamp: "10:15", speaker: "Carol", content: "What about the database schema?", pageId: "p2" },
  { id: "l5", timestamp: "10:20", speaker: "Bob", content: "Let's move to next steps", pageId: "p3" },
];

// Recommended view modes per topic (from analysis)
export type TopicViewMode = {
  topicId: string;
  viewMode: ViewMode;
};

export function useSyncVision() {
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [activePageId, setActivePageId] = useState("p2");
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [topicViewModes, setTopicViewModes] = useState<TopicViewMode[]>([]);

  const activePage = pages.find((p) => p.id === activePageId)!;
  const activeItems = activePage?.items || [];

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
      setDraggedItemId(itemId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropOnQuadrant = useCallback(
    (quadrantId: QuadrantId) => {
      if (!draggedItemId) return;

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;
          return {
            ...page,
            items: page.items.map((item) =>
              item.id === draggedItemId
                ? { ...item, quadrant: quadrantId }
                : item
            ),
          };
        })
      );
      setDraggedItemId(null);
    },
    [draggedItemId, activePageId]
  );

  const handleDropOnColumn = useCallback(
    (statusId: StatusId) => {
      if (!draggedItemId) return;

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;
          return {
            ...page,
            items: page.items.map((item) =>
              item.id === draggedItemId ? { ...item, status: statusId } : item
            ),
          };
        })
      );
      setDraggedItemId(null);
    },
    [draggedItemId, activePageId]
  );

  const handleDropOnInbox = useCallback(() => {
    if (!draggedItemId) return;

    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== activePageId) return page;
        return {
          ...page,
          items: page.items.map((item) =>
            item.id === draggedItemId
              ? { ...item, quadrant: null, status: null }
              : item
          ),
        };
      })
    );
    setDraggedItemId(null);
  }, [draggedItemId, activePageId]);

  // Item handlers
  const addItem = useCallback(
    (content: string) => {
      const newItem: Item = {
        id: `${Date.now()}`,
        content,
        quadrant: null,
        status: null,
      };

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;
          return { ...page, items: [...page.items, newItem] };
        })
      );
    },
    [activePageId]
  );

  const deleteItem = useCallback(
    (itemId: string) => {
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== activePageId) return page;
          return {
            ...page,
            items: page.items.filter((item) => item.id !== itemId),
          };
        })
      );
    },
    [activePageId]
  );

  // Page handlers
  const addPage = useCallback(() => {
    const newPage: Page = {
      id: `p${Date.now()}`,
      title: `New Topic ${pages.length + 1}`,
      status: "pending",
      items: [],
    };
    setPages((prev) => [...prev, newPage]);
  }, [pages.length]);

  const togglePageStatus = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const newStatus =
          page.status === "pending"
            ? "doing"
            : page.status === "doing"
            ? "done"
            : "pending";
        return { ...page, status: newStatus };
      })
    );
  }, []);

  // Apply analysis results from Gemini
  const applyAnalysisResults = useCallback((topics: AnalyzedTopic[]) => {
    // Convert analyzed topics to pages
    const newPages: Page[] = topics.map((topic, index) => ({
      id: topic.id,
      title: topic.title,
      status: index === 0 ? "doing" : "pending",
      items: topic.items.map((item, itemIndex) => ({
        id: `${topic.id}_${itemIndex}`,
        content: item.content,
        quadrant: item.quadrant,
        status: item.status,
      })),
    }));

    // Convert related logs to LogEntry format
    const newLogs: LogEntry[] = topics.flatMap((topic) =>
      topic.relatedLogs.map((log, logIndex) => ({
        id: `${topic.id}_log_${logIndex}`,
        timestamp: log.timestamp,
        speaker: log.speaker,
        content: log.content,
        pageId: topic.id,
      }))
    );

    // Set recommended view modes per topic
    const newViewModes: TopicViewMode[] = topics.map((topic) => ({
      topicId: topic.id,
      viewMode: topic.visualizationFrame,
    }));

    setPages(newPages);
    setLogs(newLogs);
    setTopicViewModes(newViewModes);

    // Set active page to first topic and its recommended view
    if (newPages.length > 0) {
      setActivePageId(newPages[0].id);
      const recommendedView = newViewModes.find((v) => v.topicId === newPages[0].id);
      if (recommendedView) {
        setViewMode(recommendedView.viewMode);
      }
    }
  }, []);

  // Get recommended view mode for current page
  const getRecommendedViewMode = useCallback(
    (pageId: string): ViewMode | null => {
      const found = topicViewModes.find((v) => v.topicId === pageId);
      return found?.viewMode || null;
    },
    [topicViewModes]
  );

  // Handle page change with auto view mode switching
  const handlePageChange = useCallback(
    (pageId: string) => {
      setActivePageId(pageId);
      const recommended = topicViewModes.find((v) => v.topicId === pageId);
      if (recommended) {
        setViewMode(recommended.viewMode);
      }
    },
    [topicViewModes]
  );

  return {
    pages,
    activePageId,
    viewMode,
    activeItems,
    logs,
    topicViewModes,
    setActivePageId: handlePageChange,
    setViewMode,
    handleDragStart,
    handleDragOver,
    handleDropOnQuadrant,
    handleDropOnColumn,
    handleDropOnInbox,
    addItem,
    deleteItem,
    addPage,
    togglePageStatus,
    applyAnalysisResults,
    getRecommendedViewMode,
  };
}
