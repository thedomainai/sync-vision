"use client";

import { useState } from "react";
import { Sparkles, Loader2, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeTranscriptAction } from "../actions";
import type { AnalysisResult, AnalyzedTopic } from "@/lib/ai/gemini";

interface TranscriptAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

// Sample transcript for demo
const SAMPLE_TRANSCRIPT = `# EC事業 定例会議 - 2026/01/30

## 参加者
- 田中（プロジェクトマネージャー）
- 佐藤（エンジニアリード）
- 鈴木（マーケティング）
- 山田（カスタマーサポート）

## 会議録

**10:00 田中**: 皆さん、おはようございます。本日の定例会議を始めます。まず、先週のセール結果について確認しましょう。

**10:02 鈴木**: 先週の冬セールですが、売上目標の120%を達成しました。特にアパレルカテゴリが好調で、前年比150%でした。

**10:04 田中**: 素晴らしい結果ですね。課題はありましたか？

**10:05 山田**: カスタマーサポートの観点からですが、配送遅延に関する問い合わせが通常の3倍ありました。特に地方への配送で問題が発生しています。

**10:07 佐藤**: システム面では、アクセス集中時にカート機能のレスポンスが遅くなる問題がありました。緊急で対応しましたが、根本的な改善が必要です。

**10:10 田中**: では、次の議題に移りましょう。来月の春物プロモーションについてです。

**10:12 鈴木**: 春物プロモーションは3月1日開始予定です。今回はSNS広告を強化し、インフルエンサーとのコラボも検討しています。予算は前回より20%増を想定しています。

**10:15 田中**: インフルエンサーマーケティングについて、もう少し詳しく教えてください。

**10:16 鈴木**: ファッション系YouTuberとInstagrammerを5名ほどリストアップしています。契約形態はアフィリエイト型を考えています。

**10:18 佐藤**: システム的にはアフィリエイトトラッキングの機能追加が必要ですね。開発期間は2週間程度見込んでいます。

**10:20 田中**: 了解しました。次に、システム改善の優先順位について話しましょう。

**10:22 佐藤**: 現在の優先課題をリストアップしました。まず、カート機能のパフォーマンス改善が最優先です。次に、検索機能の精度向上、そしてモバイルアプリのUI刷新があります。

**10:25 田中**: それぞれの緊急度と重要度はどうですか？

**10:26 佐藤**: カート改善は緊急かつ重要です。セール時に直接売上に影響します。検索機能は重要ですが緊急ではありません。モバイルUIは長期的な投資として重要ですが、今すぐではないです。

**10:28 山田**: サポートの観点から、FAQページの改善も追加してほしいです。問い合わせの30%はFAQで解決できる内容なので。

**10:30 田中**: 最後に、配送問題の対策について話しましょう。

**10:32 山田**: 配送業者との契約見直しを提案します。現在の業者は地方配送に弱いので、地域特化型の業者を追加で契約することを検討しています。

**10:35 田中**: コスト面はどうですか？

**10:36 山田**: 初期費用はかかりますが、クレーム対応コストと顧客離脱を考えると、半年で回収できる見込みです。

**10:38 佐藤**: 配送状況のリアルタイムトラッキング機能も実装したいですね。これがあれば問い合わせも減るはずです。

**10:40 田中**: 良い提案ですね。では、本日の議論をまとめます。次回までのアクションアイテムを確認しましょう。

**10:42 田中**: 以上で本日の会議を終了します。お疲れ様でした。`;

export function TranscriptAnalyzer({ onAnalysisComplete }: TranscriptAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError("Please enter a transcript");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyDjXlBMxkwUgTlh625xpa6CZhUNHiu9DJc";
    const result = await analyzeTranscriptAction(transcript, apiKey);

    setIsAnalyzing(false);

    if (result.success) {
      onAnalysisComplete(result.data);
      setIsOpen(false);
      setTranscript("");
    } else {
      setError(result.error);
    }
  };

  const handleLoadSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Analyze Transcript
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Transcript Analysis
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>

        <div className="p-4 flex-1 overflow-auto space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-2">
              <FileText className="h-4 w-4" />
              Load Sample
            </Button>
            <span className="text-sm text-muted-foreground">
              or paste your meeting transcript below
            </span>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your meeting transcript here..."
            className="w-full h-80 p-3 border rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium">AI will analyze the transcript and:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Extract agenda topics</li>
              <li>Suggest visualization frames (Matrix/Kanban/List)</li>
              <li>Classify items by priority and status</li>
              <li>Link related discussion logs</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !transcript.trim()}>
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze with Gemini
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
