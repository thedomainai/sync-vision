"use client";

import { useState, useRef, useCallback } from "react";
import {
  createDeepgramWebSocket,
  sendAudioToDeepgram,
  closeDeepgramConnection,
  type DeepgramTranscriptResult,
} from "@/lib/ai/deepgram";

export type RecordingStatus = "idle" | "recording" | "paused";

export interface TranscriptionSegment {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
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
  const { apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY, language = "ja" } = options;

  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const segmentIdRef = useRef(0);

  const handleTranscript = useCallback((result: DeepgramTranscriptResult) => {
    const transcriptText = result.channel.alternatives[0]?.transcript || "";

    if (!transcriptText) return;

    if (result.is_final) {
      setTranscript((prev) => {
        const newText = prev ? `${prev} ${transcriptText}` : transcriptText;
        return newText;
      });
      setInterimTranscript("");

      const newSegment: TranscriptionSegment = {
        id: `seg-${segmentIdRef.current++}`,
        text: transcriptText,
        isFinal: true,
        timestamp: Date.now(),
      };
      setSegments((prev) => [...prev, newSegment]);
    } else {
      setInterimTranscript(transcriptText);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!apiKey) {
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
        { apiKey, language },
        handleTranscript,
        (err) => {
          setError(err.message);
          stopRecording();
        },
        () => {
          setStatus("idle");
        }
      );

      socketRef.current = socket;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("WebSocket connection timeout"));
        }, 5000);

        socket.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        socket.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("WebSocket connection failed"));
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
      const message = err instanceof Error ? err.message : "Failed to start recording";
      setError(message);
      stopRecording();
    }
  }, [apiKey, language, handleTranscript]);

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

  const pauseRecording = useCallback(() => {
    if (status !== "recording") return;

    if (processorRef.current) {
      processorRef.current.disconnect();
    }

    setStatus("paused");
  }, [status]);

  const resumeRecording = useCallback(() => {
    if (status !== "paused" || !audioContextRef.current || !processorRef.current) return;

    if (mediaStreamRef.current) {
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    }

    setStatus("recording");
  }, [status]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setSegments([]);
    segmentIdRef.current = 0;
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
