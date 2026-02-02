// Deepgram API Client for realtime transcription

export interface DeepgramTranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
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

export type DeepgramMessage = DeepgramTranscriptResult | DeepgramMetadata;

export interface DeepgramConfig {
  apiKey: string;
  language?: string;
  model?: string;
  punctuate?: boolean;
  smartFormat?: boolean;
  interimResults?: boolean;
  utteranceEndMs?: number;
  vadEvents?: boolean;
}

const DEFAULT_CONFIG: Partial<DeepgramConfig> = {
  language: "ja",
  model: "nova-2",
  punctuate: true,
  smartFormat: true,
  interimResults: true,
  utteranceEndMs: 1000,
  vadEvents: true,
};

export function createDeepgramWebSocket(
  config: DeepgramConfig,
  onTranscript: (result: DeepgramTranscriptResult) => void,
  onError: (error: Error) => void,
  onClose: () => void
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
  });

  const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

  const socket = new WebSocket(url, ["token", mergedConfig.apiKey]);

  socket.onopen = () => {
    console.log("[Deepgram] WebSocket connected");
  };

  socket.onmessage = (event) => {
    try {
      const data: DeepgramMessage = JSON.parse(event.data);

      if (data.type === "Results") {
        onTranscript(data);
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

export function sendAudioToDeepgram(socket: WebSocket, audioData: ArrayBuffer): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(audioData);
  }
}

export function closeDeepgramConnection(socket: WebSocket): void {
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close();
  }
}
