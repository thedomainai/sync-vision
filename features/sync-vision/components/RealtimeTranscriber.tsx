"use client";

import { useState } from "react";
import { Mic, MicOff, Square, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRealtimeTranscription } from "../hooks/useRealtimeTranscription";

interface RealtimeTranscriberProps {
  onSendToAnalysis: (transcript: string) => void;
}

export function RealtimeTranscriber({ onSendToAnalysis }: RealtimeTranscriberProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    status,
    transcript,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useRealtimeTranscription();

  const handleToggleRecording = async () => {
    if (status === "idle") {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  const handleSendToAnalysis = () => {
    if (transcript.trim()) {
      onSendToAnalysis(transcript);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Mic className="h-4 w-4" />
        Start Recording
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {status === "recording" ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Recording...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 text-primary" />
                Realtime Transcription
              </>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => {
            stopRecording();
            setIsOpen(false);
          }}>
            Close
          </Button>
        </div>

        <div className="p-4 flex-1 overflow-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleRecording}
              variant={status === "recording" ? "destructive" : "default"}
              className="gap-2"
            >
              {status === "recording" ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>

            {transcript && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearTranscript}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          <div
            className={cn(
              "min-h-[300px] p-4 border rounded-lg bg-gray-50",
              status === "recording" && "border-red-200 bg-red-50/30"
            )}
          >
            {!transcript && !interimTranscript && status === "idle" && (
              <p className="text-muted-foreground text-sm">
                Click &quot;Start Recording&quot; to begin transcription. Speak clearly into your microphone.
              </p>
            )}

            {!transcript && !interimTranscript && status === "recording" && (
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Listening...
              </p>
            )}

            <div className="space-y-2">
              {transcript && (
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                </p>
              )}

              {interimTranscript && (
                <p className="text-gray-400 italic">
                  {interimTranscript}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium">Tips:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Speak clearly at a moderate pace</li>
              <li>Use a quiet environment for best results</li>
              <li>Click &quot;Send to Analysis&quot; when done to analyze with Gemini</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              stopRecording();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendToAnalysis}
            disabled={!transcript.trim()}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Send to Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
