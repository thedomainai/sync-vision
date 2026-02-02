"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bot, Loader2, Square, Video, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createBot,
  getBotStatus,
  leaveBot,
  validateMeetingUrl,
  getStatusLabel,
  isBotActive,
  type BotStatus,
  type CreateBotResponse,
} from "@/lib/api/meeting-bridge";

interface MeetingBotPanelProps {
  onTranscriptReceived?: (transcript: string) => void;
}

type PanelState = "idle" | "joining" | "active" | "error";

export function MeetingBotPanel({ onTranscriptReceived }: MeetingBotPanelProps) {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [panelState, setPanelState] = useState<PanelState>("idle");
  const [botInfo, setBotInfo] = useState<CreateBotResponse | null>(null);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Poll for bot status when active
  const startPolling = useCallback((botId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const poll = async () => {
      try {
        const status = await getBotStatus(botId);
        setBotStatus(status.status as BotStatus);

        // Stop polling if bot is done
        if (status.status === "done" || status.status === "fatal") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setPanelState(status.status === "fatal" ? "error" : "idle");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 5 seconds
    pollingRef.current = setInterval(poll, 5000);
    // Initial poll
    poll();
  }, []);

  const handleUrlChange = (value: string) => {
    setMeetingUrl(value);
    setUrlError(null);

    if (value.trim()) {
      const validation = validateMeetingUrl(value);
      if (!validation.valid) {
        setUrlError(validation.error || "Invalid URL");
      }
    }
  };

  const handleJoinMeeting = async () => {
    if (!meetingUrl.trim()) {
      setUrlError("Please enter a meeting URL");
      return;
    }

    const validation = validateMeetingUrl(meetingUrl);
    if (!validation.valid) {
      setUrlError(validation.error || "Invalid URL");
      return;
    }

    setError(null);
    setPanelState("joining");

    try {
      const result = await createBot({
        meetingUrl,
        botName: "SyncVision Bot",
      });

      setBotInfo(result);
      setBotStatus(result.status as BotStatus);
      setPanelState("active");
      startPolling(result.botId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join meeting");
      setPanelState("error");
    }
  };

  const handleLeaveMeeting = async () => {
    if (!botInfo?.botId) return;

    try {
      await leaveBot(botInfo.botId);

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      setBotInfo(null);
      setBotStatus(null);
      setPanelState("idle");
      setMeetingUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave meeting");
    }
  };

  const handleReset = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setBotInfo(null);
    setBotStatus(null);
    setPanelState("idle");
    setError(null);
    setMeetingUrl("");
    setUrlError(null);
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Meeting Bot</span>
        {botStatus && isBotActive(botStatus) && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Active
          </span>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Idle State - Show URL input */}
        {panelState === "idle" && (
          <>
            <div className="space-y-1">
              <Input
                placeholder="Meeting URL (Google Meet, Zoom, Teams, Webex)"
                value={meetingUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !urlError) handleJoinMeeting();
                }}
                className={urlError ? "border-red-300" : ""}
              />
              {urlError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {urlError}
                </p>
              )}
            </div>
            <Button
              onClick={handleJoinMeeting}
              disabled={!meetingUrl.trim() || !!urlError}
              className="w-full gap-2"
              size="sm"
            >
              <Video className="h-4 w-4" />
              Join Meeting
            </Button>
          </>
        )}

        {/* Joining State */}
        {panelState === "joining" && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Connecting bot to meeting...</span>
          </div>
        )}

        {/* Active State - Show status and leave button */}
        {panelState === "active" && botInfo && (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium flex items-center gap-1">
                  {botStatus === "in_call_recording" && (
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                  {botStatus ? getStatusLabel(botStatus) : "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bot ID:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {botInfo.botId.slice(0, 8)}...
                </span>
              </div>
            </div>

            <Button
              onClick={handleLeaveMeeting}
              variant="destructive"
              className="w-full gap-2"
              size="sm"
            >
              <Square className="h-4 w-4" />
              Leave Meeting
            </Button>
          </>
        )}

        {/* Error State */}
        {panelState === "error" && (
          <>
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error || "An error occurred"}</span>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full" size="sm">
              Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
