"use server";

import { analyzeTranscript, type AnalysisResult } from "@/lib/ai/gemini";

export async function analyzeTranscriptAction(
  transcript: string,
  apiKey: string
): Promise<{ success: true; data: AnalysisResult } | { success: false; error: string }> {
  try {
    const result = await analyzeTranscript(transcript, apiKey);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
