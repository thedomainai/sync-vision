// Gemini API Client for realtime conversation frame analysis

import type {
  Frame,
  FrameType,
  MatrixFrame,
  LogicTreeFrame,
  WhiteboardFrame,
  TimelineFrame,
  RealtimeAnalysisResult,
} from "@/types/frames";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const REALTIME_ANALYSIS_PROMPT = `あなたは会議ファシリテーションの専門家です。リアルタイムの会話内容を分析し、最適な可視化フレームで整理してください。

## 利用可能なフレーム

### 1. matrix（4象限マトリクス）- 動的軸生成
- 用途: 比較検討、優先順位付け、分析
- 使うべき場面: 2軸で整理できる議論
- **重要**: 軸は議論内容に応じて毎回適切なものを考えてください
  - 例: 「コスト × 効果」「短期 × 長期」「難易度 × インパクト」「リスク × リターン」

### 2. timeline（タイムライン）
- 用途: 時系列整理、フェーズ管理、業務フロー可視化
- 使うべき場面: 時間軸、段階、プロセスに関する話題
- timelineType:
  - "period": 時期（Q1, Q2, 今月, 来月, 来年 など）
  - "phase": フェーズ（企画, 設計, 開発, テスト, リリース など）
  - "flow": 業務フロー（受注, 製造, 出荷, 納品 など）
- カテゴリは議論内容に応じて3〜6個程度設定

### 3. logic-tree（ロジックツリー / マインドマップ）
- 用途: 問題分解、原因分析、階層的整理
- 使うべき場面: 「なぜ」「原因」「要因」「分類」「構造」などの話題

### 4. whiteboard（ホワイトボード + 付箋）
- 用途: ブレインストーミング、アイデア出し、自由な発想
- 使うべき場面: 「アイデア」「案」「提案」「可能性」などの話題

## 出力形式（JSON）

フレームタイプに応じて以下の形式で出力してください。

### matrixの場合（軸は議論内容から動的に生成）:
{
  "suggestedFrame": "matrix",
  "frameReason": "このフレームを選んだ理由",
  "summary": "会話の要約（1-2文）",
  "frame": {
    "type": "matrix",
    "title": "フレームのタイトル",
    "axisLabels": {
      "xPositive": "X軸の正方向ラベル（例: 高コスト）",
      "xNegative": "X軸の負方向ラベル（例: 低コスト）",
      "yPositive": "Y軸の正方向ラベル（例: 高効果）",
      "yNegative": "Y軸の負方向ラベル（例: 低効果）"
    },
    "labels": {
      "q1": "第1象限の説明（例: 高コスト＆高効果）",
      "q2": "第2象限の説明（例: 低コスト＆高効果）",
      "q3": "第3象限の説明（例: 高コスト＆低効果）",
      "q4": "第4象限の説明（例: 低コスト＆低効果）"
    },
    "items": [
      {"id": "m1", "content": "項目内容", "speaker": "発言者", "quadrant": "q1"}
    ]
  }
}

### timelineの場合:
{
  "suggestedFrame": "timeline",
  "frameReason": "このフレームを選んだ理由",
  "summary": "会話の要約（1-2文）",
  "frame": {
    "type": "timeline",
    "title": "フレームのタイトル",
    "timelineType": "period|phase|flow",
    "categories": [
      {"id": "c1", "label": "Q1", "description": "1月〜3月"},
      {"id": "c2", "label": "Q2", "description": "4月〜6月"},
      {"id": "c3", "label": "Q3", "description": "7月〜9月"},
      {"id": "c4", "label": "Q4", "description": "10月〜12月"}
    ],
    "items": [
      {"id": "t1", "content": "タスク内容", "speaker": "発言者", "categoryId": "c1"}
    ]
  }
}

### logic-treeの場合:
{
  "suggestedFrame": "logic-tree",
  "frameReason": "このフレームを選んだ理由",
  "summary": "会話の要約（1-2文）",
  "frame": {
    "type": "logic-tree",
    "title": "フレームのタイトル",
    "nodes": [
      {
        "id": "n1",
        "content": "メインテーマ",
        "children": [
          {"id": "n1-1", "content": "サブトピック1", "speaker": "発言者", "children": []},
          {"id": "n1-2", "content": "サブトピック2", "children": [
            {"id": "n1-2-1", "content": "詳細", "children": []}
          ]}
        ]
      }
    ]
  }
}

### whiteboardの場合:
{
  "suggestedFrame": "whiteboard",
  "frameReason": "このフレームを選んだ理由",
  "summary": "会話の要約（1-2文）",
  "frame": {
    "type": "whiteboard",
    "title": "フレームのタイトル",
    "width": 800,
    "height": 600,
    "notes": [
      {"id": "s1", "content": "アイデア内容", "speaker": "発言者", "color": "yellow", "x": 100, "y": 100},
      {"id": "s2", "content": "別のアイデア", "color": "blue", "x": 250, "y": 150}
    ]
  }
}

## 付箋の色の使い分け
- yellow: 一般的なアイデア、意見
- blue: 質問、疑問点
- green: 解決策、ポジティブな提案
- pink: 問題点、リスク
- orange: 重要な指摘
- purple: 未決定事項、要検討

## 注意事項
- 会話内容がまだ少ない場合は whiteboard で付箋として整理
- 会話が進むにつれて適切なフレームに変更を提案
- matrixの軸は必ず議論内容から適切なものを考えて設定すること
- timelineのカテゴリは議論内容に応じて適切な数と内容を設定すること
- 発言者名が分かる場合は speaker フィールドに記録
- idは一意になるよう連番で付与

会話内容:
`;

export async function analyzeConversationRealtime(
  transcript: string,
  apiKey: string,
  previousFrame?: Frame
): Promise<RealtimeAnalysisResult> {
  const contextHint = previousFrame
    ? `\n\n前回のフレーム: ${previousFrame.type}\n継続性を考慮してください。大きな変更がない限り同じフレームタイプを維持。\n\n`
    : "";

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: REALTIME_ANALYSIS_PROMPT + contextHint + transcript,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API Error:", {
      status: response.status,
      error,
    });
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  try {
    const result = JSON.parse(text) as RealtimeAnalysisResult;
    result.lastProcessedText = transcript;
    return result;
  } catch {
    throw new Error(`Failed to parse Gemini response: ${text}`);
  }
}

// Create empty frames for initialization
export function createEmptyFrame(type: FrameType): Frame {
  switch (type) {
    case "matrix":
      return {
        type: "matrix",
        title: "分析マトリクス",
        axisLabels: {
          xPositive: "高",
          xNegative: "低",
          yPositive: "高",
          yNegative: "低",
        },
        labels: {
          q1: "高 × 高",
          q2: "低 × 高",
          q3: "高 × 低",
          q4: "低 × 低",
        },
        items: [],
      } as MatrixFrame;

    case "timeline":
      return {
        type: "timeline",
        title: "タイムライン",
        timelineType: "phase",
        categories: [
          { id: "c1", label: "Phase 1" },
          { id: "c2", label: "Phase 2" },
          { id: "c3", label: "Phase 3" },
        ],
        items: [],
      } as TimelineFrame;

    case "logic-tree":
      return {
        type: "logic-tree",
        title: "ロジックツリー",
        nodes: [],
      } as LogicTreeFrame;

    case "whiteboard":
      return {
        type: "whiteboard",
        title: "ブレインストーミング",
        width: 800,
        height: 600,
        notes: [],
      } as WhiteboardFrame;
  }
}
