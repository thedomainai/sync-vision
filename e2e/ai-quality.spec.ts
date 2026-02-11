import { test, expect } from "@playwright/test";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface AnalysisResult {
  suggestedFrame: string;
  frameReason: string;
  summary: string;
  frame: Record<string, unknown>;
  openQuestions: Array<{
    id: string;
    question: string;
    currentUnderstanding: string;
    informationNeeded: string;
    resolved: boolean;
    speaker?: string;
  }>;
}

const ANALYSIS_PROMPT = `あなたは会議ファシリテーションの専門家です。リアルタイムの会話内容を分析し、最適な可視化フレームで整理してください。

## 利用可能なフレーム
- matrix: 2軸での比較・優先順位付け
- timeline: 時系列・フェーズ・業務フロー
- logic-tree: 問題分解・原因分析
- whiteboard: ブレインストーミング

## 出力形式（JSON）
{
  "suggestedFrame": "matrix|timeline|logic-tree|whiteboard",
  "frameReason": "選択理由",
  "summary": "会話の要約",
  "frame": { ... },
  "openQuestions": [
    {
      "id": "q1",
      "question": "論点",
      "currentUnderstanding": "現時点の理解",
      "informationNeeded": "必要な情報",
      "resolved": false,
      "speaker": "発言者"
    }
  ]
}

会話内容:
`;

async function analyzeWithGemini(
  transcript: string,
  apiKey: string
): Promise<AnalysisResult> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: ANALYSIS_PROMPT + transcript }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
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

test.describe("AI Analysis Quality", () => {
  const apiKey = process.env.GEMINI_API_KEY;

  test.skip(!apiKey, "GEMINI_API_KEY not configured");

  test("extracts topics from business discussion", async () => {
    const transcript = `
田中: 次の四半期の目標について話し合いましょう。
佐藤: 売上を20%増やすことを目指したいです。
田中: それは野心的ですね。どうやって達成しますか？
佐藤: 新規顧客の獲得と既存顧客の単価アップの両方で攻めたいです。
鈴木: マーケティング予算は増やせますか？
田中: 予算についてはまだ確定していません。
    `.trim();

    const result = await analyzeWithGemini(transcript, apiKey!);

    expect(result.suggestedFrame).toBeDefined();
    expect(result.summary).toBeTruthy();
    expect(result.summary.length).toBeGreaterThan(10);
    expect(result.frame).toBeDefined();
  });

  test("extracts open questions correctly", async () => {
    const transcript = `
山田: プロジェクトの進捗はどうですか？
伊藤: 開発は順調ですが、テスト環境がまだ準備できていません。
山田: いつ頃準備できそうですか？
伊藤: インフラチームに確認が必要です。まだ決まっていません。
山田: 予算の承認は取れましたか？
伊藤: それも上層部の判断待ちです。
    `.trim();

    const result = await analyzeWithGemini(transcript, apiKey!);

    expect(result.openQuestions).toBeDefined();
    expect(Array.isArray(result.openQuestions)).toBe(true);
    expect(result.openQuestions.length).toBeGreaterThan(0);

    // Should detect undecided items
    const questions = result.openQuestions.map((q) => q.question.toLowerCase());
    const hasRelevantQuestion = questions.some(
      (q) =>
        q.includes("テスト") ||
        q.includes("環境") ||
        q.includes("予算") ||
        q.includes("承認")
    );
    expect(hasRelevantQuestion).toBe(true);
  });

  test("handles technical discussion", async () => {
    const transcript = `
エンジニアA: このアーキテクチャだとスケーラビリティに問題がありそうです。
エンジニアB: マイクロサービスに分割した方がいいかもしれません。
エンジニアA: その場合、データベースの整合性はどう担保しますか？
エンジニアC: イベントソーシングパターンを使えば解決できます。
エンジニアB: 実装コストが高くなりそうですね。
    `.trim();

    const result = await analyzeWithGemini(transcript, apiKey!);

    expect(result.suggestedFrame).toBeDefined();
    expect(["matrix", "logic-tree"]).toContain(result.suggestedFrame);
  });

  test("generates summary within reasonable length", async () => {
    const transcript = `
社長: 来年の事業計画について議論しましょう。
部長A: 新規事業として海外展開を検討しています。
部長B: 国内市場の深耕も重要です。
社長: 両方同時に進められますか？
部長A: リソースが限られているので優先順位をつける必要があります。
    `.trim();

    const result = await analyzeWithGemini(transcript, apiKey!);

    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(20);
    expect(result.summary.length).toBeLessThan(500);
  });
});
