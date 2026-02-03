import { test, expect } from "@playwright/test";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface FrameSelectionResult {
  suggestedFrame: "matrix" | "timeline" | "logic-tree" | "whiteboard";
  frameReason: string;
}

const FRAME_SELECTION_PROMPT = `あなたは会議ファシリテーションの専門家です。会話内容に最適なフレームを選択してください。

## 利用可能なフレーム
- matrix: 2軸での比較・優先順位付け（例: 重要度×緊急度、コスト×効果）
- timeline: 時系列・フェーズ・業務フロー
- logic-tree: 問題分解・原因分析・階層的整理
- whiteboard: ブレインストーミング・アイデア出し

## 出力形式（JSON）
{
  "suggestedFrame": "matrix|timeline|logic-tree|whiteboard",
  "frameReason": "選択理由"
}

会話内容:
`;

async function selectFrame(
  transcript: string,
  apiKey: string
): Promise<FrameSelectionResult> {
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: FRAME_SELECTION_PROMPT + transcript }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
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

test.describe("Frame Selection Accuracy", () => {
  const apiKey = process.env.GEMINI_API_KEY;

  test.skip(!apiKey, "GEMINI_API_KEY not configured");

  test.describe("Matrix Frame Selection", () => {
    test("selects matrix for priority/urgency discussion", async () => {
      const transcript = `
田中: これらのタスクを優先度と緊急度で整理しましょう。
佐藤: A案は重要だけど急ぎではないですね。
田中: B案は緊急だけど重要度は低いかもしれません。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("matrix");
    });

    test("selects matrix for cost-benefit analysis", async () => {
      const transcript = `
山田: 各施策のコストと効果を比較しましょう。
伊藤: クラウド移行は高コストだけど効果も大きいです。
山田: 業務改善ツール導入は低コストで効果も中程度ですね。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("matrix");
    });

    test("selects matrix for comparison discussion", async () => {
      const transcript = `
課長: A案とB案を比較検討しましょう。
メンバー1: A案はリスクが高いけど見返りも大きいです。
メンバー2: B案は安全策ですが成長は限定的です。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("matrix");
    });
  });

  test.describe("Timeline Frame Selection", () => {
    test("selects timeline for phase discussion", async () => {
      const transcript = `
PM: プロジェクトのフェーズを整理しましょう。
開発: 第1フェーズは企画と要件定義、第2フェーズは設計と開発です。
PM: 第3フェーズでテストとリリースですね。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("timeline");
    });

    test("selects timeline for quarterly planning", async () => {
      const transcript = `
部長: 年間計画を四半期ごとに整理しましょう。
課長: Q1は基盤整備、Q2は新機能開発を予定しています。
部長: Q3とQ4はどうしますか？
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("timeline");
    });

    test("selects timeline for process flow discussion", async () => {
      const transcript = `
リーダー: 業務フローを整理しましょう。
メンバー: まず受注処理があって、次に在庫確認、そして出荷手配です。
リーダー: 最後に請求処理ですね。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("timeline");
    });
  });

  test.describe("Logic Tree Frame Selection", () => {
    test("selects logic-tree for root cause analysis", async () => {
      const transcript = `
マネージャー: なぜこの問題が発生したのか原因を分析しましょう。
エンジニア: 直接的な原因はテスト不足です。
マネージャー: なぜテスト不足になったのですか？
エンジニア: スケジュールが厳しかったのと、テスト環境の準備が遅れたからです。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("logic-tree");
    });

    test("selects logic-tree for problem decomposition", async () => {
      const transcript = `
コンサル: この課題を分解して整理しましょう。
クライアント: 大きく分けると組織の問題とシステムの問題があります。
コンサル: 組織の問題はさらに人材とプロセスに分類できますね。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("logic-tree");
    });

    test("selects logic-tree for hierarchical categorization", async () => {
      const transcript = `
部長: 製品ラインナップを体系的に整理したいです。
課長: 大分類としてハードウェアとソフトウェアがあります。
部長: ハードウェアの中にはPCと周辺機器がありますね。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("logic-tree");
    });
  });

  test.describe("Whiteboard Frame Selection", () => {
    test("selects whiteboard for brainstorming", async () => {
      const transcript = `
ファシリ: 新サービスのアイデアを自由に出してください。
参加者A: AIを使った自動化サービスはどうでしょう？
参加者B: サブスクリプション型のコンサルサービスも面白いかも。
参加者C: 他にも色々なアイデアが浮かんできました。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("whiteboard");
    });

    test("selects whiteboard for open-ended ideation", async () => {
      const transcript = `
リーダー: 何でもいいのでアイデアを出し合いましょう。
メンバー1: 思いつくままに言いますね。
メンバー2: 批判なしで自由に発想しましょう。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("whiteboard");
    });

    test("selects whiteboard for early-stage discussion", async () => {
      const transcript = `
社長: まだ方向性が決まっていないので、可能性を探りましょう。
役員: 様々な案を出してみましょう。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.suggestedFrame).toBe("whiteboard");
    });
  });

  test.describe("Edge Cases", () => {
    test("handles mixed signals gracefully", async () => {
      const transcript = `
参加者: 優先度を決めたいけど、まずはアイデアを出し合いましょう。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(["matrix", "whiteboard"]).toContain(result.suggestedFrame);
    });

    test("provides reasoning for selection", async () => {
      const transcript = `
田中: コストと効果のバランスを見て判断しましょう。
      `.trim();

      const result = await selectFrame(transcript, apiKey!);
      expect(result.frameReason).toBeTruthy();
      expect(result.frameReason.length).toBeGreaterThan(10);
    });
  });
});
