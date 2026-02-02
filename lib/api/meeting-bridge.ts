/**
 * Meeting Bridge API Client
 * Communicates with meeting-bridge Cloudflare Worker
 */

const MEETING_BRIDGE_URL =
  process.env.NEXT_PUBLIC_MEETING_BRIDGE_URL ||
  "https://meeting-bridge.nakabayashi-48f.workers.dev";

export interface CreateBotRequest {
  meetingUrl: string;
  botName?: string;
}

export interface CreateBotResponse {
  botId: string;
  meetingUrl: string;
  status: string;
}

export interface BotStatusResponse {
  botId: string;
  meetingUrl: string;
  status: string;
  videoUrl?: string;
}

export interface MeetingBridgeError {
  error: string;
  supportedPlatforms?: string[];
}

export type BotStatus =
  | "created"
  | "joining_call"
  | "in_waiting_room"
  | "in_call_not_recording"
  | "in_call_recording"
  | "call_ended"
  | "done"
  | "fatal";

const SUPPORTED_PLATFORMS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
  "webex.com",
];

/**
 * Validate if the meeting URL is from a supported platform
 */
export function validateMeetingUrl(url: string): {
  valid: boolean;
  platform?: string;
  error?: string;
} {
  try {
    const urlObj = new URL(url);
    const platform = SUPPORTED_PLATFORMS.find((p) =>
      urlObj.hostname.includes(p)
    );

    if (!platform) {
      return {
        valid: false,
        error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(", ")}`,
      };
    }

    return { valid: true, platform };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Create a bot to join a meeting
 */
export async function createBot(
  request: CreateBotRequest
): Promise<CreateBotResponse> {
  const response = await fetch(`${MEETING_BRIDGE_URL}/api/bot/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = (await response.json()) as MeetingBridgeError;
    throw new Error(error.error || "Failed to create bot");
  }

  return response.json();
}

/**
 * Get bot status
 */
export async function getBotStatus(botId: string): Promise<BotStatusResponse> {
  const response = await fetch(
    `${MEETING_BRIDGE_URL}/api/bot/status?botId=${encodeURIComponent(botId)}`
  );

  if (!response.ok) {
    const error = (await response.json()) as MeetingBridgeError;
    throw new Error(error.error || "Failed to get bot status");
  }

  return response.json();
}

/**
 * Remove bot from meeting
 */
export async function leaveBot(botId: string): Promise<void> {
  const response = await fetch(`${MEETING_BRIDGE_URL}/api/bot/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botId }),
  });

  if (!response.ok) {
    const error = (await response.json()) as MeetingBridgeError;
    throw new Error(error.error || "Failed to remove bot");
  }
}

/**
 * Check if meeting-bridge service is available
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MEETING_BRIDGE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: BotStatus): string {
  const labels: Record<BotStatus, string> = {
    created: "作成済み",
    joining_call: "参加中...",
    in_waiting_room: "待機室で待機中",
    in_call_not_recording: "通話中（録音準備中）",
    in_call_recording: "録音中",
    call_ended: "通話終了",
    done: "完了",
    fatal: "エラー",
  };
  return labels[status] || status;
}

/**
 * Check if bot is in an active state
 */
export function isBotActive(status: BotStatus): boolean {
  return [
    "joining_call",
    "in_waiting_room",
    "in_call_not_recording",
    "in_call_recording",
  ].includes(status);
}
