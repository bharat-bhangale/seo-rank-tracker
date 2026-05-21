import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { contentApi } from "@/lib/contentApi";
import {
  FileText,
  Sparkles,
  Loader2,
  BarChart3,
  Copy,
  CheckCircle,
} from "lucide-react";

export function ContentBriefPage() {
  const [activeTab, setActiveTab] = useState<"brief" | "score">("brief");
  const [keyword, setKeyword] = useState("");
  const [content, setContent] = useState("");
  const [scoreKeyword, setScoreKeyword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Generate brief mutation
  const generateBrief = useMutation({
    mutationFn: () => contentApi.generateBrief({ keyword }),
    onSuccess: (res) => {
      setResult(res.data.data.report);
      toast.success("Content brief generated!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to generate brief");
    },
  });

  // Score content mutation
  const scoreContent = useMutation({
    mutationFn: () => contentApi.scoreContent({ keyword: scoreKeyword, content }),
    onSuccess: (res) => {
      setResult(res.data.data.report);
      toast.success("Content scored successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to score content");
    },
  });

  const handleCopy = () => {
    if (result?.rawResponse) {
      navigator.clipboard.writeText(JSON.stringify(result.rawResponse, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Content Studio</h1>
        <p className="text-surface-500 mt-1">
          AI-powered content briefs and optimization scoring
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-100 rounded-lg p-1 mb-6 w-fit">
        <button
          onClick={() => {
            setActiveTab("brief");
            setResult(null);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "brief"
              ? "bg-white text-primary-700 shadow-sm"
              : "text-surface-600 hover:text-surface-900"
          }`}
        >
          <Sparkles className="h-4 w-4 inline mr-1.5" />
          Content Brief
        </button>
        <button
          onClick={() => {
            setActiveTab("score");
            setResult(null);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "score"
              ? "bg-white text-primary-700 shadow-sm"
              : "text-surface-600 hover:text-surface-900"
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-1.5" />
          Content Scorer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="card">
          {activeTab === "brief" ? (
            <>
              <h2 className="text-lg font-semibold text-surface-900 mb-4">
                Generate Content Brief
              </h2>
              <p className="text-sm text-surface-500 mb-4">
                Enter a target keyword to generate a comprehensive content brief based on top-ranking pages.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="label">Target Keyword</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., best project management tools 2026"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => generateBrief.mutate()}
                  disabled={!keyword.trim() || generateBrief.isPending}
                  className="btn btn-primary w-full"
                >
                  {generateBrief.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Brief
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-surface-900 mb-4">
                Score Your Content
              </h2>
              <p className="text-sm text-surface-500 mb-4">
                Paste your content to get an optimization score and improvement suggestions.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="label">Target Keyword</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., email marketing tips"
                    value={scoreKeyword}
                    onChange={(e) => setScoreKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Your Content</label>
                  <textarea
                    className="input min-h-[200px] resize-y"
                    placeholder="Paste your article content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <p className="text-xs text-surface-400 mt-1">
                    {content.length} characters ({Math.round(content.split(/\s+/).filter(Boolean).length)} words)
                  </p>
                </div>
                <button
                  onClick={() => scoreContent.mutate()}
                  disabled={
                    !scoreKeyword.trim() ||
                    content.length < 50 ||
                    scoreContent.isPending
                  }
                  className="btn btn-primary w-full"
                >
                  {scoreContent.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scoring...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      Score Content
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Result Panel */}
        <div className="card">
          {result ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success-500" />
                  <h3 className="font-semibold text-surface-900">
                    {activeTab === "brief" ? "Content Brief" : "Content Score"}
                  </h3>
                </div>
                <button onClick={handleCopy} className="btn btn-ghost text-xs">
                  {copied ? (
                    <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {result.executiveSummary && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-primary-800">{result.executiveSummary}</p>
                </div>
              )}

              {/* Token usage */}
              {result.tokenUsage && (
                <div className="flex gap-4 text-xs text-surface-400 mb-4">
                  <span>{result.tokenUsage.totalTokens} tokens</span>
                  <span>${result.tokenUsage.estimatedCostUsd.toFixed(4)}</span>
                  <span>{result.tokenUsage.model}</span>
                </div>
              )}

              {/* Raw response display */}
              <div className="bg-surface-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-xs text-surface-700 whitespace-pre-wrap font-mono">
                  {JSON.stringify(result.rawResponse, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-surface-300 mb-3" />
              <h3 className="text-lg font-medium text-surface-700">
                {activeTab === "brief" ? "Your brief will appear here" : "Score results will appear here"}
              </h3>
              <p className="text-sm text-surface-500 mt-1">
                {activeTab === "brief"
                  ? "Enter a keyword and click generate"
                  : "Paste content and click score"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
