"use client";

import { useState } from "react";
import { LayoutGrid, Columns, List, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ViewMode } from "@/types";
import type { AnalysisResult } from "@/lib/ai/gemini";
import { useSyncVision } from "../hooks/useSyncVision";
import { ProgressBar } from "./ProgressBar";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { MatrixView } from "./MatrixView";
import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { Inbox } from "./Inbox";
import { TranscriptAnalyzer } from "./TranscriptAnalyzer";
import { RealtimeTranscriber } from "./RealtimeTranscriber";
import { AnalysisResultView } from "./AnalysisResultView";

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
    topicViewModes,
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
    applyAnalysisResults,
    getRecommendedViewMode,
  } = useSyncVision();

  const [newItemText, setNewItemText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [transcriptionText, setTranscriptionText] = useState("");
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      addItem(newItemText.trim());
      setNewItemText("");
    }
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result);
    setShowAnalyzer(false);
    setTranscriptionText("");
  };

  const handleSendToAnalysis = (transcript: string) => {
    setTranscriptionText(transcript);
    setShowAnalyzer(true);
  };

  const handleApplyAnalysis = (topics: AnalysisResult["topics"]) => {
    applyAnalysisResults(topics);
    setAnalysisResult(null);
  };

  const recommendedView = getRecommendedViewMode(activePageId);

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
                className={cn(
                  "gap-2",
                  recommendedView === tab.id && viewMode !== tab.id && "ring-2 ring-primary/30"
                )}
              >
                {tab.icon}
                {tab.label}
                {recommendedView === tab.id && (
                  <Sparkles className="h-3 w-3 text-amber-500" />
                )}
              </Button>
            ))}

            <div className="flex-1" />

            {/* AI Analysis Buttons */}
            <RealtimeTranscriber onSendToAnalysis={handleSendToAnalysis} />
            <TranscriptAnalyzer
              onAnalysisComplete={handleAnalysisComplete}
              initialTranscript={transcriptionText}
              autoOpen={showAnalyzer}
            />
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

      {/* Analysis Result Modal */}
      {analysisResult && (
        <AnalysisResultView
          result={analysisResult}
          onApply={handleApplyAnalysis}
          onClose={() => setAnalysisResult(null)}
        />
      )}
    </div>
  );
}
