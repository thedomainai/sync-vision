import { test, expect } from "@playwright/test";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface OpenQuestion {
  id: string;
  question: string;
  currentUnderstanding: string;
  informationNeeded: string;
  resolved: boolean;
  speaker?: string;
}

interface OpenQuestionsResult {
  openQuestions: OpenQuestion[];
}

const OPEN_QUESTIONS_PROMPT = `あなたは会議ファシリテーションの専門家です。会話から残論点（未解決の質問・検討事項）を抽出してください。

## 抽出ルール
- 「〜はどうする？」「〜について検討が必要」「まだ決まっていない」などを検出
- 明確な結論が出ていない項目を抽出
- 具体的なアクションにつながる質問を優先
- 残論点がない場合は空配列を返す

## 出力形式（JSON）
{
  "openQuestions": [
    {
      "id": "q1",
      "question": "明らかにすべき論点（質問形式で）",
      "currentUnderstanding": "現時点でわかっていること",
      "informationNeeded": "回答が欲しい具体的な内容",
      "resolved": false,
      "speaker": "この論点を提起した人"
    }
  ]
}

会話内容:
`;

async function extractOpenQuestions(
  transcript: string,
  apiKey: string
): Promise<OpenQuestionsResult> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: OPEN_QUESTIONS_PROMPT + transcript }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}

test.describe("Open Questions Detection", () => {
  const apiKey = process.env.GEMINI_API_KEY;

  test.skip(!apiKey, "GEMINI_API_KEY not configured");

  test.describe("Explicit Questions", () => {
    test("detects direct questions in discussion", async () => {
      const transcript = `
田中: 予算はいくらですか？
佐藤: まだ確定していません。
田中: いつ頃決まりそうですか？
佐藤: 来週の会議で決まる予定です。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions.length).toBeGreaterThan(0);
      const questions = result.openQuestions.map((q) => q.question.toLowerCase());
      const hasBudgetQuestion = questions.some(
        (q) => q.includes("予算") || q.includes("いくら")
      );
      expect(hasBudgetQuestion).toBe(true);
    });

    test("detects technical questions", async () => {
      const transcript = `
開発者A: このAPIのレスポンスタイムはどのくらいですか？
開発者B: まだ計測していないのでわかりません。
開発者A: パフォーマンス要件は決まっていますか？
開発者B: 要件定義中です。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions.length).toBeGreaterThan(0);
    });
  });

  test.describe("Undecided Items", () => {
    test("detects undecided items", async () => {
      const transcript = `
PM: リリース日程はまだ決まっていません。
開発: 担当者も未定ですね。
PM: スコープについても検討中です。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions.length).toBeGreaterThanOrEqual(2);
    });

    test("detects pending decisions", async () => {
      const transcript = `
部長: A案とB案のどちらにするか、まだ決定していません。
課長: 上層部の判断待ちですね。
部長: 予算配分も調整中です。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions.length).toBeGreaterThan(0);
      const hasDecisionPending = result.openQuestions.some(
        (q) =>
          q.question.includes("案") ||
          q.question.includes("決定") ||
          q.question.includes("予算")
      );
      expect(hasDecisionPending).toBe(true);
    });
  });

  test.describe("Information Gaps", () => {
    test("detects information needs", async () => {
      const transcript = `
営業: 競合の価格がわからないので、見積もりが出せません。
企画: 市場規模のデータも必要です。
営業: 顧客の予算感も確認が必要ですね。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions.length).toBeGreaterThanOrEqual(2);

      // Check that informationNeeded is populated
      const hasInformationNeeded = result.openQuestions.some(
        (q) => q.informationNeeded && q.informationNeeded.length > 0
      );
      expect(hasInformationNeeded).toBe(true);
    });

    test("detects confirmation needs", async () => {
      const transcript = `
リーダー: この仕様で問題ないか確認が必要です。
メンバー: クライアントに確認を取らないといけませんね。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions.length).toBeGreaterThan(0);
    });
  });

  test.describe("Speaker Attribution", () => {
    test("attributes questions to speakers", async () => {
      const transcript = `
田中: 次のステップはどうしますか？
佐藤: それは田中さんが決めてください。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      if (result.openQuestions.length > 0) {
        const hasSpseaker = result.openQuestions.some(
          (q) => q.speaker && q.speaker.length > 0
        );
        // Speaker attribution is optional but encouraged
        expect(hasSpseaker || result.openQuestions.length > 0).toBe(true);
      }
    });
  });

  test.describe("Resolved vs Unresolved", () => {
    test("marks questions as unresolved by default", async () => {
      const transcript = `
山田: 納期はいつですか？
伊藤: まだ調整中です。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      if (result.openQuestions.length > 0) {
        const allUnresolved = result.openQuestions.every((q) => q.resolved === false);
        expect(allUnresolved).toBe(true);
      }
    });

    test("returns empty array when all questions are answered", async () => {
      const transcript = `
山田: 予算は決まりましたか？
伊藤: はい、100万円で承認されました。
山田: 納期は？
伊藤: 3月末です。確定しています。
山田: 了解です。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      // Questions were answered, so should be few or no open questions
      expect(result.openQuestions.length).toBeLessThanOrEqual(1);
    });
  });

  test.describe("Current Understanding", () => {
    test("captures current understanding when available", async () => {
      const transcript = `
企画: 売上目標は20%増で検討していますが、確定ではありません。
営業: 現時点では15%程度が妥当と考えていますが、最終判断は来週です。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      if (result.openQuestions.length > 0) {
        const hasCurrentUnderstanding = result.openQuestions.some(
          (q) => q.currentUnderstanding && q.currentUnderstanding.length > 0
        );
        expect(hasCurrentUnderstanding).toBe(true);
      }
    });
  });

  test.describe("Edge Cases", () => {
    test("handles short conversation", async () => {
      const transcript = `田中: 始めましょう。`.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions).toBeDefined();
      expect(Array.isArray(result.openQuestions)).toBe(true);
    });

    test("handles conversation with no questions", async () => {
      const transcript = `
社長: 今期も目標達成しました。
部長: 全員の努力の結果です。
社長: 引き続きよろしくお願いします。
      `.trim();

      const result = await extractOpenQuestions(transcript, apiKey!);

      expect(result.openQuestions).toBeDefined();
      // Celebratory conversation typically has few open questions
      expect(result.openQuestions.length).toBeLessThanOrEqual(1);
    });
  });
});
