// Deepgram API Client for realtime transcription

export interface DeepgramTranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
  speaker?: number;
}

export interface DeepgramTranscriptAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramTranscriptWord[];
}

export interface DeepgramTranscriptChannel {
  alternatives: DeepgramTranscriptAlternative[];
}

export interface DeepgramTranscriptResult {
  type: "Results";
  channel_index: number[];
  duration: number;
  start: number;
  is_final: boolean;
  speech_final: boolean;
  channel: DeepgramTranscriptChannel;
}

export interface DeepgramUtteranceEnd {
  type: "UtteranceEnd";
  last_word_end: number;
  channel: number[];
}

export interface DeepgramMetadata {
  type: "Metadata";
  transaction_key: string;
  request_id: string;
  sha256: string;
  created: string;
  duration: number;
  channels: number;
  models: string[];
}

export type DeepgramMessage =
  | DeepgramTranscriptResult
  | DeepgramUtteranceEnd
  | DeepgramMetadata;

export interface DeepgramConfig {
  apiKey: string;
  language?: string;
  model?: string;
  punctuate?: boolean;
  smartFormat?: boolean;
  interimResults?: boolean;
  utteranceEndMs?: number;
  vadEvents?: boolean;
  encoding?: string;
  sampleRate?: number;
  channels?: number;
  endpointing?: number | false;
  fillerWords?: boolean;
  numerals?: boolean;
}

const DEFAULT_CONFIG: Partial<DeepgramConfig> = {
  language: "ja",
  model: "nova-2",
  punctuate: true,
  smartFormat: true,
  interimResults: true,
  utteranceEndMs: 500,
  vadEvents: true,
  encoding: "linear16",
  sampleRate: 16000,
  channels: 1,
  endpointing: 500,
  fillerWords: true,
  numerals: true,
};

export interface DeepgramCallbacks {
  onTranscript: (result: DeepgramTranscriptResult) => void;
  onUtteranceEnd?: (result: DeepgramUtteranceEnd) => void;
  onError: (error: Error) => void;
  onClose: () => void;
  onOpen?: () => void;
}

export function createDeepgramWebSocket(
  config: DeepgramConfig,
  onTranscript: (result: DeepgramTranscriptResult) => void,
  onError: (error: Error) => void,
  onClose: () => void,
  options?: {
    onUtteranceEnd?: (result: DeepgramUtteranceEnd) => void;
    onOpen?: () => void;
  }
): WebSocket {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const params = new URLSearchParams({
    language: mergedConfig.language!,
    model: mergedConfig.model!,
    punctuate: String(mergedConfig.punctuate),
    smart_format: String(mergedConfig.smartFormat),
    interim_results: String(mergedConfig.interimResults),
    utterance_end_ms: String(mergedConfig.utteranceEndMs),
    vad_events: String(mergedConfig.vadEvents),
    encoding: mergedConfig.encoding!,
    sample_rate: String(mergedConfig.sampleRate),
    channels: String(mergedConfig.channels),
    filler_words: String(mergedConfig.fillerWords),
    numerals: String(mergedConfig.numerals),
  });

  if (mergedConfig.endpointing !== undefined) {
    params.set(
      "endpointing",
      mergedConfig.endpointing === false
        ? "false"
        : String(mergedConfig.endpointing)
    );
  }

  const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

  const socket = new WebSocket(url, ["token", mergedConfig.apiKey]);

  socket.onopen = () => {
    console.log("[Deepgram] WebSocket connected");
    options?.onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const data: DeepgramMessage = JSON.parse(event.data);

      if (data.type === "Results") {
        onTranscript(data);
      } else if (data.type === "UtteranceEnd") {
        options?.onUtteranceEnd?.(data);
      }
    } catch (error) {
      console.error("[Deepgram] Failed to parse message:", error);
    }
  };

  socket.onerror = (event) => {
    console.error("[Deepgram] WebSocket error:", event);
    onError(new Error("WebSocket connection error"));
  };

  socket.onclose = (event) => {
    console.log("[Deepgram] WebSocket closed:", event.code, event.reason);
    onClose();
  };

  return socket;
}

/**
 * Send a keep-alive message to prevent Deepgram from closing idle connections.
 * Deepgram closes connections after ~10s of no audio.
 */
export function sendKeepAlive(socket: WebSocket): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "KeepAlive" }));
  }
}

export function sendAudioToDeepgram(
  socket: WebSocket,
  audioData: ArrayBuffer
): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(audioData);
  }
}

export function closeDeepgramConnection(socket: WebSocket): void {
  if (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CONNECTING
  ) {
    // Send CloseStream for graceful shutdown (Deepgram will flush remaining audio)
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "CloseStream" }));
    }
    socket.close();
  }
}
