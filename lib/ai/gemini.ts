// Gemini API Client for transcript analysis

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface AnalyzedTopic {
  id: string;
  title: string;
  summary: string;
  visualizationFrame: "matrix" | "kanban" | "list";
  frameReason: string;
  items: AnalyzedItem[];
  relatedLogs: LogSegment[];
}

export interface AnalyzedItem {
  content: string;
  quadrant: "q1" | "q2" | "q3" | "q4" | null;
  status: "backlog" | "todo" | "doing" | "done" | null;
  speaker: string;
}

export interface LogSegment {
  timestamp: string;
  speaker: string;
  content: string;
}

export interface AnalysisResult {
  topics: AnalyzedTopic[];
  overallSummary: string;
}

const ANALYSIS_PROMPT = `あなたは会議ファシリテーションの専門家です。以下の会議録を分析し、議題ごとに整理してください。

## 出力形式（JSON）
{
  "overallSummary": "会議全体の要約（2-3文）",
  "topics": [
    {
      "id": "topic_1",
      "title": "議題のタイトル",
      "summary": "この議題の要約",
      "visualizationFrame": "matrix" | "kanban" | "list",
      "frameReason": "このビジュアライゼーションフレームを選んだ理由",
      "items": [
        {
          "content": "具体的なアイテム/タスク/課題",
          "quadrant": "q1" | "q2" | "q3" | "q4" | null,
          "status": "backlog" | "todo" | "doing" | "done" | null,
          "speaker": "発言者名"
        }
      ],
      "relatedLogs": [
        {
          "timestamp": "10:00",
          "speaker": "発言者",
          "content": "発言内容"
        }
      ]
    }
  ]
}

## ビジュアライゼーションフレームの選択基準
- **matrix**: 優先度付け・意思決定が必要な議題（重要度×緊急度の4象限）
- **kanban**: タスク管理・進捗確認が必要な議題（Backlog→Todo→Doing→Done）
- **list**: 情報共有・報告が中心の議題（一覧表示）

## 4象限（quadrant）の基準
- q1: 重要かつ緊急（すぐに対応が必要）
- q2: 重要だが緊急ではない（計画的に対応）
- q3: 重要ではないが緊急（委任可能）
- q4: 重要でも緊急でもない（削除検討）

## ステータス（status）の基準
- backlog: 将来やるべきこと
- todo: 次にやること
- doing: 進行中
- done: 完了済み

会議録:
`;

export async function analyzeTranscript(
  transcript: string,
  apiKey: string
): Promise<AnalysisResult> {
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
              text: ANALYSIS_PROMPT + transcript,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch {
    throw new Error(`Failed to parse Gemini response: ${text}`);
  }
}
