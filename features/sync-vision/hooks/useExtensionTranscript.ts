import { useState, useEffect, useCallback, useRef } from "react";

interface TranscriptMessage {
  type: "transcript";
  transcript: string;
  isFinal: boolean;
  speaker?: string;
}

interface ConnectionMessage {
  type: "connected" | "deepgram_connected" | "deepgram_disconnected";
  message: string;
  clientId?: string;
}

type WebSocketMessage = TranscriptMessage | ConnectionMessage;

interface UseExtensionTranscriptOptions {
  wsServerUrl?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  autoConnect?: boolean;
}

interface UseExtensionTranscriptReturn {
  isConnected: boolean;
  isReceiving: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  clearTranscript: () => void;
}

export function useExtensionTranscript({
  wsServerUrl = "ws://localhost:3001",
  onTranscript,
  autoConnect = false,
}: UseExtensionTranscriptOptions = {}): UseExtensionTranscriptReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setError(null);

    try {
      const ws = new WebSocket(wsServerUrl);

      ws.onopen = () => {
        console.log("[ExtensionTranscript] Connected to WebSocket server");
        setIsConnected(true);
        setError(null);

        // Subscribe to transcripts
        ws.send(JSON.stringify({ type: "subscribe" }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "transcript":
              if (message.isFinal) {
                setTranscript((prev) =>
                  prev ? `${prev} ${message.transcript}` : message.transcript
                );
                setInterimTranscript("");
                setIsReceiving(true);
                onTranscript?.(message.transcript, true);
              } else {
                setInterimTranscript(message.transcript);
                onTranscript?.(message.transcript, false);
              }
              break;

            case "deepgram_connected":
              console.log("[ExtensionTranscript] Deepgram connected");
              setIsReceiving(true);
              break;

            case "deepgram_disconnected":
              console.log("[ExtensionTranscript] Deepgram disconnected");
              setIsReceiving(false);
              break;

            case "connected":
              console.log("[ExtensionTranscript] Server confirmed connection");
              break;
          }
        } catch (e) {
          console.error("[ExtensionTranscript] Failed to parse message:", e);
        }
      };

      ws.onclose = () => {
        console.log("[ExtensionTranscript] Disconnected from WebSocket server");
        setIsConnected(false);
        setIsReceiving(false);
        wsRef.current = null;

        // Auto-reconnect after 5 seconds if autoConnect is enabled
        if (autoConnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[ExtensionTranscript] Attempting to reconnect...");
            connect();
          }, 5000);
        }
      };

      ws.onerror = (event) => {
        console.error("[ExtensionTranscript] WebSocket error:", event);
        setError("WebSocket connection error");
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("[ExtensionTranscript] Failed to connect:", e);
      setError("Failed to connect to WebSocket server");
    }
  }, [wsServerUrl, autoConnect, onTranscript]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsReceiving(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isReceiving,
    transcript,
    interimTranscript,
    error,
    connect,
    disconnect,
    clearTranscript,
  };
}
