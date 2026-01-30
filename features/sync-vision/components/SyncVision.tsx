"use client";

import { useState } from "react";
import { LayoutGrid, Columns, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ViewMode } from "@/types";
import { useSyncVision } from "../hooks/useSyncVision";
import { ProgressBar } from "./ProgressBar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { MatrixView } from "./MatrixView";
import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { Inbox } from "./Inbox";

const VIEW_TABS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "matrix", label: "Matrix", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "kanban", label: "Kanban", icon: <Columns className="h-4 w-4" /> },
  { id: "list", label: "List", icon: <List className="h-4 w-4" /> },
];

export function SyncVision() {
  const {
    pages,
    activePageId,
    viewMode,
    activeItems,
    logs,
    setActivePageId,
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
  } = useSyncVision();

  const [newItemText, setNewItemText] = useState("");

  const handleAddItem = () => {
    if (newItemText.trim()) {
      addItem(newItemText.trim());
      setNewItemText("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation - Progress Bar */}
      <ProgressBar
        pages={pages}
        activePageId={activePageId}
        onPageClick={setActivePageId}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Meeting Log */}
        <LeftSidebar
          logs={logs}
          activePageId={activePageId}
          onLogClick={setActivePageId}
        />

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* View Tabs */}
          <div className="flex items-center gap-2 p-4 border-b bg-white">
            {VIEW_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={viewMode === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(tab.id)}
                className="gap-2"
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>

          {/* View Content */}
          <div className="flex-1 overflow-auto p-4">
            {viewMode === "matrix" && (
              <MatrixView
                items={activeItems}
                onDragStart={handleDragStart}
                onDrop={handleDropOnQuadrant}
                onDragOver={handleDragOver}
              />
            )}
            {viewMode === "kanban" && (
              <KanbanView
                items={activeItems}
                onDragStart={handleDragStart}
                onDrop={handleDropOnColumn}
                onDragOver={handleDragOver}
              />
            )}
            {viewMode === "list" && (
              <ListView items={activeItems} onDelete={deleteItem} />
            )}
          </div>

          {/* Bottom Area - Add Item & Inbox */}
          <div className="p-4 border-t bg-white space-y-4">
            {/* Add Item Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Add new item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddItem();
                }}
                className="flex-1"
              />
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Inbox */}
            <Inbox
              items={activeItems}
              onDragStart={handleDragStart}
              onDrop={handleDropOnInbox}
              onDragOver={handleDragOver}
            />
          </div>
        </main>

        {/* Right Sidebar - Page List */}
        <RightSidebar
          pages={pages}
          activePageId={activePageId}
          onPageClick={setActivePageId}
          onAddPage={addPage}
          onTogglePageStatus={togglePageStatus}
        />
      </div>
    </div>
  );
}
