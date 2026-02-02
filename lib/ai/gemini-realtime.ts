// Gemini API Client for realtime conversation frame analysis

import type {
  Frame,
  FrameType,
  MatrixFrame,
  LogicTreeFrame,
  WhiteboardFrame,
  RealtimeAnalysisResult,
} from "@/types/frames";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const REALTIME_ANALYSIS_PROMPT = `あなたは会議ファシリテーションの専門家です。リアルタイムの会話内容を分析し、最適な可視化フレームで整理してください。

## 利用可能なフレーム

### 1. matrix（4象限マトリクス）
- 用途: 優先順位付け、SWOT分析、比較検討
- 使うべき場面: 「重要」「緊急」「メリット」「デメリット」「強み」「弱み」などの話題

### 2. logic-tree（ロジックツリー / マインドマップ）
- 用途: 問題分解、原因分析、階層的整理
- 使うべき場面: 「なぜ」「原因」「要因」「分類」「構造」などの話題

### 3. whiteboard（ホワイトボード + 付箋）
- 用途: ブレインストーミング、アイデア出し、自由な発想
- 使うべき場面: 「アイデア」「案」「提案」「可能性」などの話題

## 出力形式（JSON）

フレームタイプに応じて以下の形式で出力してください。

### matrixの場合:
{
  "suggestedFrame": "matrix",
  "frameReason": "このフレームを選んだ理由",
  "summary": "会話の要約（1-2文）",
  "frame": {
    "type": "matrix",
    "title": "フレームのタイトル",
    "labels": {
      "q1": "第1象限のラベル（例: 重要＆緊急）",
      "q2": "第2象限のラベル（例: 重要＆非緊急）",
      "q3": "第3象限のラベル（例: 非重要＆緊急）",
      "q4": "第4象限のラベル（例: 非重要＆非緊急）"
    },
    "items": [
      {"id": "m1", "content": "項目内容", "speaker": "発言者", "quadrant": "q1"}
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
        title: "優先順位マトリクス",
        labels: {
          q1: "重要 & 緊急",
          q2: "重要 & 非緊急",
          q3: "非重要 & 緊急",
          q4: "非重要 & 非緊急",
        },
        items: [],
      } as MatrixFrame;

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
