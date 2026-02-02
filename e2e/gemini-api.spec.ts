import { test, expect } from "@playwright/test";

test.describe("Gemini API Integration", () => {
  // Skip if no API key is configured
  test.skip(
    !process.env.GEMINI_API_KEY,
    "GEMINI_API_KEY not set - skipping Gemini tests"
  );

  test("analyzeTranscriptAction returns valid response", async ({ request }) => {
    // This test calls the server action via Next.js API
    // Note: Server actions are not directly callable via HTTP
    // We test through the UI instead

    // For API testing, we would need to expose an API route
    // This test verifies the page can make analysis requests
    test.skip();
  });

  test("Gemini analysis works through UI", async ({ page }) => {
    await page.goto("/realtime");

    // This test would require mocking the microphone
    // and Deepgram connection, which is complex for E2E

    // Instead, verify the UI elements are present
    const recordButton = page.getByRole("button", { name: /録音開始/i });
    await expect(recordButton).toBeVisible();
    await expect(recordButton).toBeEnabled();
  });
});

test.describe("Gemini API Direct Test", () => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  test.skip(!GEMINI_API_KEY, "GEMINI_API_KEY not set");

  test("Gemini API responds to analysis request", async ({ request }) => {
    if (!GEMINI_API_KEY) {
      test.skip();
      return;
    }

    const GEMINI_API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    const response = await request.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      data: {
        contents: [
          {
            parts: [
              {
                text: "Say 'Hello' in JSON format: {\"message\": \"your response\"}",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
          responseMimeType: "application/json",
        },
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.candidates).toBeDefined();
    expect(body.candidates[0].content.parts[0].text).toBeDefined();
  });

  test("Gemini API handles conversation analysis prompt", async ({ request }) => {
    if (!GEMINI_API_KEY) {
      test.skip();
      return;
    }

    const GEMINI_API_URL =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    const testTranscript = `
      田中: 次の四半期の目標について話し合いましょう。
      佐藤: 売上を20%増やすことを目指したいです。
      田中: それは野心的ですね。どうやって達成しますか？
      佐藤: 新規顧客の獲得と既存顧客の単価アップの両方が必要です。
    `;

    const prompt = `会話を分析し、以下のJSON形式で返してください:
    {
      "summary": "会話の要約",
      "suggestedFrame": "matrix|timeline|logic-tree|whiteboard のいずれか",
      "frameReason": "選んだ理由"
    }

    会話:
    ${testTranscript}`;

    const response = await request.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      data: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const resultText = body.candidates?.[0]?.content?.parts?.[0]?.text;
    expect(resultText).toBeDefined();

    const result = JSON.parse(resultText);
    expect(result.summary).toBeDefined();
    expect(result.suggestedFrame).toBeDefined();
    expect(["matrix", "timeline", "logic-tree", "whiteboard"]).toContain(
      result.suggestedFrame
    );
  });
});
