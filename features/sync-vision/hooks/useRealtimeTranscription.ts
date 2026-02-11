"use client";

import { useState, useRef, useCallback } from "react";
import {
  createDeepgramWebSocket,
  sendAudioToDeepgram,
  sendKeepAlive,
  closeDeepgramConnection,
  type DeepgramTranscriptResult,
  type DeepgramUtteranceEnd,
} from "@/lib/ai/deepgram";

export type RecordingStatus = "idle" | "recording" | "paused";

export interface TranscriptionSegment {
  id: string;
  text: string;
  isFinal: boolean;
  speechFinal: boolean;
  timestamp: number;
  confidence: number;
}

export interface UseRealtimeTranscriptionOptions {
  apiKey?: string;
  language?: string;
}

export interface UseRealtimeTranscriptionReturn {
  status: RecordingStatus;
  transcript: string;
  interimTranscript: string;
  segments: TranscriptionSegment[];
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearTranscript: () => void;
}

export function useRealtimeTranscription(
  options: UseRealtimeTranscriptionOptions = {}
): UseRealtimeTranscriptionReturn {
  const { apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY, language = "ja" } =
    options;

  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentIdRef = useRef(0);

  // Buffer for accumulating interim results within a speech turn
  const turnBufferRef = useRef("");

  const handleTranscript = useCallback(
    (result: DeepgramTranscriptResult) => {
      const transcriptText =
        result.channel.alternatives[0]?.transcript || "";

      if (!transcriptText) return;

      const confidence = result.channel.alternatives[0]?.confidence ?? 0;

      if (result.is_final) {
        // Accumulate final chunks within the current speech turn
        turnBufferRef.current = turnBufferRef.current
          ? `${turnBufferRef.current}${transcriptText}`
          : transcriptText;
        setInterimTranscript("");

        if (result.speech_final) {
          // speech_final = true: end of a natural speech turn
          // Flush the turn buffer as a complete segment
          const turnText = turnBufferRef.current;
          turnBufferRef.current = "";

          setTranscript((prev) =>
            prev ? `${prev}\n${turnText}` : turnText
          );

          const newSegment: TranscriptionSegment = {
            id: `seg-${segmentIdRef.current++}`,
            text: turnText,
            isFinal: true,
            speechFinal: true,
            timestamp: Date.now(),
            confidence,
          };
          setSegments((prev) => [...prev, newSegment]);
        }
      } else {
        // Show interim: turn buffer so far + current interim
        const display = turnBufferRef.current
          ? `${turnBufferRef.current}${transcriptText}`
          : transcriptText;
        setInterimTranscript(display);
      }
    },
    []
  );

  const handleUtteranceEnd = useCallback(() => {
    // Utterance end: flush any remaining turn buffer
    if (turnBufferRef.current) {
      const turnText = turnBufferRef.current;
      turnBufferRef.current = "";

      setTranscript((prev) =>
        prev ? `${prev}\n${turnText}` : turnText
      );
      setInterimTranscript("");

      const newSegment: TranscriptionSegment = {
        id: `seg-${segmentIdRef.current++}`,
        text: turnText,
        isFinal: true,
        speechFinal: true,
        timestamp: Date.now(),
        confidence: 0,
      };
      setSegments((prev) => [...prev, newSegment]);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current.port.close();
      workletNodeRef.current = null;
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
  }, []);

  const startRecording = useCallback(async () => {
    if (!apiKey) {
      setError("Deepgram API key is not configured");
      return;
    }

    setError(null);
    turnBufferRef.current = "";

    try {
      // 1. Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Connect to Deepgram
      const socket = createDeepgramWebSocket(
        { apiKey, language },
        handleTranscript,
        (err) => {
          setError(err.message);
          stopRecording();
        },
        () => setStatus("idle"),
        {
          onUtteranceEnd: handleUtteranceEnd,
        }
      );
      socketRef.current = socket;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Connection timeout")),
          5000
        );
        socket.addEventListener(
          "open",
          () => {
            clearTimeout(timeout);
            resolve();
          },
          { once: true }
        );
        socket.addEventListener(
          "error",
          () => {
            clearTimeout(timeout);
            reject(new Error("Connection failed"));
          },
          { once: true }
        );
      });

      // 3. Set up AudioWorklet pipeline
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/audio-worklet-processor.js");

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(
        audioContext,
        "audio-capture-processor"
      );
      workletNodeRef.current = workletNode;

      // Receive PCM16 chunks from worklet thread and send to Deepgram
      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          sendAudioToDeepgram(socketRef.current, event.data);
        }
      };

      source.connect(workletNode);
      // AudioWorklet doesn't need to connect to destination for capture-only

      // 4. Keep-alive to prevent Deepgram timeout during silence
      keepAliveRef.current = setInterval(() => {
        if (socketRef.current) {
          sendKeepAlive(socketRef.current);
        }
      }, 8000);

      setStatus("recording");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start recording";
      setError(message);
      cleanup();
    }
  }, [apiKey, language, handleTranscript, handleUtteranceEnd, cleanup]);

  const stopRecording = useCallback(() => {
    // Flush any remaining turn buffer
    if (turnBufferRef.current) {
      const turnText = turnBufferRef.current;
      turnBufferRef.current = "";
      setTranscript((prev) =>
        prev ? `${prev}\n${turnText}` : turnText
      );
      setInterimTranscript("");
    }

    cleanup();
    setStatus("idle");
    setInterimTranscript("");
  }, [cleanup]);

  const pauseRecording = useCallback(() => {
    if (status !== "recording") return;

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
    }

    setStatus("paused");
  }, [status]);

  const resumeRecording = useCallback(() => {
    if (
      status !== "paused" ||
      !audioContextRef.current ||
      !workletNodeRef.current
    )
      return;

    if (mediaStreamRef.current) {
      const source = audioContextRef.current.createMediaStreamSource(
        mediaStreamRef.current
      );
      source.connect(workletNodeRef.current);
    }

    setStatus("recording");
  }, [status]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setSegments([]);
    segmentIdRef.current = 0;
    turnBufferRef.current = "";
  }, []);

  return {
    status,
    transcript,
    interimTranscript,
    segments,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearTranscript,
  };
}
