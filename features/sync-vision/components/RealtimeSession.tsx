"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Mic,
  MicOff,
  Square,
  Loader2,
  LayoutGrid,
  GitBranch,
  StickyNote,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Frame, FrameType, TranscriptSegment } from "@/types/frames";
import {
  createDeepgramWebSocket,
  sendAudioToDeepgram,
  closeDeepgramConnection,
  type DeepgramTranscriptResult,
} from "@/lib/ai/deepgram";
import {
  analyzeConversationRealtime,
  createEmptyFrame,
} from "@/lib/ai/gemini-realtime";
import { LogicTree, Whiteboard, MatrixFrame, TimelineFrame } from "./frames";

type RecordingStatus = "idle" | "recording" | "paused";

interface RealtimeSessionProps {
  deepgramApiKey?: string;
  geminiApiKey?: string;
}

const FRAME_TABS: { id: FrameType; label: string; icon: React.ReactNode }[] = [
  { id: "matrix", label: "マトリクス", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "timeline", label: "タイムライン", icon: <Calendar className="h-4 w-4" /> },
  { id: "logic-tree", label: "ロジックツリー", icon: <GitBranch className="h-4 w-4" /> },
  { id: "whiteboard", label: "ホワイトボード", icon: <StickyNote className="h-4 w-4" /> },
];

export function RealtimeSession({
  deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
  geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY,
}: RealtimeSessionProps) {
  // Recording state
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<Frame>(createEmptyFrame("whiteboard"));
  const [selectedFrameType, setSelectedFrameType] = useState<FrameType | null>(null);
  const [summary, setSummary] = useState("");
  const [frameReason, setFrameReason] = useState("");

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedTextRef = useRef("");

  // Auto-analyze when transcript changes (debounced)
  useEffect(() => {
    if (!transcript || transcript === lastAnalyzedTextRef.current) return;

    // Clear existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Set new timeout for analysis (analyze after 3 seconds of no new input)
    analysisTimeoutRef.current = setTimeout(() => {
      runAnalysis();
    }, 3000);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [transcript]);

  const runAnalysis = useCallback(async () => {
    if (!geminiApiKey || !transcript.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeConversationRealtime(
        transcript,
        geminiApiKey,
        currentFrame
      );

      // Only update if user hasn't manually selected a frame type
      if (!selectedFrameType || selectedFrameType === result.suggestedFrame) {
        setCurrentFrame(result.frame);
      }

      setSummary(result.summary);
      setFrameReason(result.frameReason);
      lastAnalyzedTextRef.current = transcript;
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "分析エラーが発生しました");
    } finally {
      setIsAnalyzing(false);
    }
  }, [transcript, geminiApiKey, currentFrame, selectedFrameType, isAnalyzing]);

  const handleTranscript = useCallback((result: DeepgramTranscriptResult) => {
    const transcriptText = result.channel.alternatives[0]?.transcript || "";
    if (!transcriptText) return;

    if (result.is_final) {
      setTranscript((prev) => (prev ? `${prev} ${transcriptText}` : transcriptText));
      setInterimTranscript("");
    } else {
      setInterimTranscript(transcriptText);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!deepgramApiKey) {
      setError("Deepgram API key is not configured");
      return;
    }

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      const socket = createDeepgramWebSocket(
        { apiKey: deepgramApiKey, language: "ja" },
        handleTranscript,
        (err) => {
          setError(err.message);
          stopRecording();
        },
        () => setStatus("idle")
      );

      socketRef.current = socket;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
        socket.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        socket.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Connection failed"));
        };
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        sendAudioToDeepgram(socketRef.current, pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setStatus("recording");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
      stopRecording();
    }
  }, [deepgramApiKey, handleTranscript]);

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (socketRef.current) {
      closeDeepgramConnection(socketRef.current);
      socketRef.current = null;
    }
    setStatus("idle");
    setInterimTranscript("");
  }, []);

  const handleFrameTypeChange = (type: FrameType) => {
    setSelectedFrameType(type);
    setCurrentFrame(createEmptyFrame(type));
    // Re-run analysis with new frame type
    if (transcript) {
      runAnalysis();
    }
  };

  const clearSession = () => {
    setTranscript("");
    setInterimTranscript("");
    setCurrentFrame(createEmptyFrame("whiteboard"));
    setSelectedFrameType(null);
    setSummary("");
    setFrameReason("");
    lastAnalyzedTextRef.current = "";
  };

  const displayFrameType = selectedFrameType || currentFrame.type;

  return (
    <div className="h-full flex flex-col">
      {/* Header controls */}
      <div className="flex items-center gap-2 p-4 border-b bg-white">
        {/* Recording button */}
        <Button
          onClick={status === "idle" ? startRecording : stopRecording}
          variant={status === "recording" ? "destructive" : "default"}
          className="gap-2"
        >
          {status === "recording" ? (
            <>
              <Square className="h-4 w-4" />
              停止
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              録音開始
            </>
          )}
        </Button>

        {status === "recording" && (
          <span className="flex items-center gap-2 text-sm text-red-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            録音中...
          </span>
        )}

        <div className="flex-1" />

        {/* Frame type tabs */}
        {FRAME_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={displayFrameType === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => handleFrameTypeChange(tab.id)}
            className="gap-2"
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}

        {/* Analysis indicator */}
        {isAnalyzing && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            分析中...
          </span>
        )}

        {/* Clear button */}
        {transcript && (
          <Button variant="outline" size="sm" onClick={clearSession} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            クリア
          </Button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Frame visualization */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {displayFrameType === "matrix" && (
            <MatrixFrame frame={currentFrame as any} />
          )}
          {displayFrameType === "timeline" && (
            <TimelineFrame frame={currentFrame as any} />
          )}
          {displayFrameType === "logic-tree" && (
            <LogicTree frame={currentFrame as any} />
          )}
          {displayFrameType === "whiteboard" && (
            <Whiteboard frame={currentFrame as any} />
          )}
        </div>

        {/* Right: Transcript panel */}
        <div className="w-80 border-l bg-white flex flex-col">
          <div className="p-3 border-b">
            <h3 className="font-medium text-sm">文字起こし</h3>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1">{summary}</p>
            )}
          </div>

          <div className="flex-1 overflow-auto p-3">
            {!transcript && !interimTranscript && (
              <p className="text-sm text-muted-foreground">
                「録音開始」をクリックして会話を始めてください
              </p>
            )}

            {transcript && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {transcript}
              </p>
            )}

            {interimTranscript && (
              <p className="text-sm text-gray-400 italic mt-2">
                {interimTranscript}
              </p>
            )}
          </div>

          {frameReason && (
            <div className="p-3 border-t bg-blue-50 text-xs text-blue-700">
              <strong>AI提案:</strong> {frameReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
