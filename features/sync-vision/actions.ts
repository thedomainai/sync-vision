"use server";

import { analyzeTranscript, type AnalysisResult } from "@/lib/ai/gemini";

export async function analyzeTranscriptAction(
  transcript: string
): Promise<{ success: true; data: AnalysisResult } | { success: false; error: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const backupApiKey = process.env.GEMINI_API_KEY_BACKUP;

    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY is not configured. Please set it in .env.local",
      };
    }

    const result = await analyzeTranscript(transcript, apiKey, backupApiKey);
    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Handle rate limit error specifically
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      return {
        success: false,
        error: "Rate limit exceeded. Please wait a moment and try again.",
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
