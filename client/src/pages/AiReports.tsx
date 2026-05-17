import { useState } from "react";
import api from "@/lib/api";
import {
  Sparkles,
  Loader2,
  FileText,
  Lightbulb,
  BarChart3,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  estimatedCostUsd: number;
}

interface AiReportData {
  _id: string;
  reportType: string;
  url?: string;
  keyword?: string;
  status: string;
  executiveSummary?: string;
  rawResponse: Record<string, unknown>;
  tokenUsage: TokenUsage;
  createdAt: string;
}

// ── Tab Config ─────────────────────────────────────────

const TABS = [
  { id: "seo-report", label: "SEO Report", icon: FileText, description: "Generate AI report from an SEO audit" },
  { id: "content-brief", label: "Content Brief", icon: Lightbulb, description: "Generate content plan for a keyword" },
  { id: "content-score", label: "Content Scorer", icon: BarChart3, description: "Score your content against SEO best practices" },
  { id: "competitor", label: "Competitor Analysis", icon: Users, description: "Analyze competitor websites" },
] as const;

// ── Reusable Components ────────────────────────────────

function TokenBadge({ usage }: { usage: TokenUsage }) {
  return (
    <div className="flex items-center gap-3 text-xs text-surface-500 bg-surface-50 px-3 py-1.5 rounded-lg">
      <span>🤖 {usage.model}</span>
      <span>📊 {usage.totalTokens.toLocaleString()} tokens</span>
      <span>💰 ${usage.estimatedCostUsd.toFixed(4)}</span>
    </div>
  );
}

function ExpandableSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-surface-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-surface-900">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-surface-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-surface-400" />
        )}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── SEO Report Form ────────────────────────────────────

function SeoReportForm({
  onResult,
  setLoading,
}: {
  onResult: (r: AiReportData) => void;
  setLoading: (l: boolean) => void;
}) {
  const [auditId, setAuditId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/ai/reports/seo", { auditId });
      onResult(res.data.data.report);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Audit ID</label>
        <input
          type="text"
          className="input"
          placeholder="Paste the audit ID from a completed SEO audit"
          value={auditId}
          onChange={(e) => setAuditId(e.target.value)}
          required
        />
        <p className="text-xs text-surface-400 mt-1">
          Run an SEO audit first, then use the audit ID here
        </p>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary">
        <Sparkles className="h-4 w-4" />
        Generate AI Report
      </button>
    </form>
  );
}

// ── Content Brief Form ─────────────────────────────────

function ContentBriefForm({
  onResult,
  setLoading,
}: {
  onResult: (r: AiReportData) => void;
  setLoading: (l: boolean) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const competitorUrls = competitors
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const res = await api.post("/ai/reports/content-brief", {
        keyword,
        competitorUrls: competitorUrls.length > 0 ? competitorUrls : undefined,
      });
      onResult(res.data.data.report);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate brief");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Target Keyword</label>
        <input
          type="text"
          className="input"
          placeholder='e.g., "best project management tools 2026"'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Competitor URLs (optional, one per line)</label>
        <textarea
          className="input min-h-[80px]"
          placeholder={"https://competitor1.com/article\nhttps://competitor2.com/guide"}
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary">
        <Lightbulb className="h-4 w-4" />
        Generate Content Brief
      </button>
    </form>
  );
}

// ── Content Scorer Form ────────────────────────────────

function ContentScorerForm({
  onResult,
  setLoading,
}: {
  onResult: (r: AiReportData) => void;
  setLoading: (l: boolean) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/ai/reports/content-score", {
        keyword,
        title,
        content,
      });
      onResult(res.data.data.report);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to score content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Target Keyword</label>
        <input
          type="text"
          className="input"
          placeholder='e.g., "how to start a blog"'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Content Title</label>
        <input
          type="text"
          className="input"
          placeholder="Your article title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Content Body</label>
        <textarea
          className="input min-h-[200px]"
          placeholder="Paste your article content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <p className="text-xs text-surface-400 mt-1">
          {content.split(/\s+/).filter((w) => w.length > 0).length} words
        </p>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary">
        <BarChart3 className="h-4 w-4" />
        Score Content
      </button>
    </form>
  );
}

// ── Competitor Analysis Form ───────────────────────────

function CompetitorForm({
  onResult,
  setLoading,
}: {
  onResult: (r: AiReportData) => void;
  setLoading: (l: boolean) => void;
}) {
  const [yourUrl, setYourUrl] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const competitorUrls = competitors
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const res = await api.post("/ai/reports/competitor-analysis", {
        yourUrl: yourUrl.startsWith("http") ? yourUrl : `https://${yourUrl}`,
        competitorUrls: competitorUrls.map((u) =>
          u.startsWith("http") ? u : `https://${u}`
        ),
      });
      onResult(res.data.data.report);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to analyze competitors");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Your Website URL</label>
        <input
          type="text"
          className="input"
          placeholder="https://yoursite.com"
          value={yourUrl}
          onChange={(e) => setYourUrl(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Competitor URLs (one per line, max 5)</label>
        <textarea
          className="input min-h-[100px]"
          placeholder={"https://competitor1.com\nhttps://competitor2.com\nhttps://competitor3.com"}
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary">
        <Users className="h-4 w-4" />
        Analyze Competitors
      </button>
    </form>
  );
}

// ── Result Display ─────────────────────────────────────

function ReportResult({ report }: { report: AiReportData }) {
  const raw = report.rawResponse || {};

  return (
    <div className="space-y-4">
      {/* Token Usage */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(report.createdAt).toLocaleString()}
        </span>
        <TokenBadge usage={report.tokenUsage} />
      </div>

      {/* Executive Summary */}
      {report.executiveSummary && (
        <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
          <h4 className="text-sm font-semibold text-primary-900 mb-1">Executive Summary</h4>
          <p className="text-sm text-primary-800">{report.executiveSummary}</p>
        </div>
      )}

      {/* SEO Report specifics */}
      {report.reportType === "seo_report" && (
        <>
          {(raw as any).prioritizedActions && (
            <ExpandableSection title="Prioritized Actions" icon={Target} defaultOpen>
              <div className="space-y-3">
                {((raw as any).prioritizedActions as any[]).map((action: any, i: number) => (
                  <div key={i} className="p-3 border border-surface-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">
                        {action.priority}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-surface-900">{action.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            action.impact === "high"
                              ? "bg-red-100 text-red-700"
                              : action.impact === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {action.impact} impact
                          </span>
                        </div>
                        <p className="text-sm text-surface-600">{action.description}</p>
                        {action.codeSnippet && (
                          <pre className="mt-2 p-2 bg-surface-900 text-emerald-400 rounded text-xs overflow-x-auto">
                            <code>{action.codeSnippet}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}

          {(raw as any).strengths && (
            <ExpandableSection title="Strengths" icon={TrendingUp}>
              <ul className="space-y-1">
                {((raw as any).strengths as string[]).map((s, i) => (
                  <li key={i} className="text-sm text-surface-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </ExpandableSection>
          )}

          {(raw as any).technicalRoadmap && (
            <ExpandableSection title="Technical Roadmap" icon={Zap}>
              <div className="space-y-2">
                {((raw as any).technicalRoadmap as any[]).map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      item.phase === "immediate"
                        ? "bg-red-100 text-red-700"
                        : item.phase === "short_term"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.phase.replace("_", " ")}
                    </span>
                    <div>
                      <span className="text-surface-900">{item.action}</span>
                      <span className="text-surface-400 text-xs ml-1">— {item.expectedImpact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}
        </>
      )}

      {/* Content Brief specifics */}
      {report.reportType === "content_brief" && (
        <>
          {(raw as any).titleSuggestions && (
            <ExpandableSection title="Title Suggestions" icon={FileText} defaultOpen>
              <ul className="space-y-1">
                {((raw as any).titleSuggestions as string[]).map((t, i) => (
                  <li key={i} className="text-sm text-surface-700 p-2 bg-surface-50 rounded">
                    {i + 1}. {t}
                  </li>
                ))}
              </ul>
            </ExpandableSection>
          )}

          {(raw as any).headingStructure && (
            <ExpandableSection title="Heading Structure" icon={Code} defaultOpen>
              <div className="space-y-1">
                {((raw as any).headingStructure as any[]).map((h: any, i: number) => (
                  <div
                    key={i}
                    className="text-sm flex items-start gap-2"
                    style={{ paddingLeft: h.tag === "h3" ? "1.5rem" : h.tag === "h2" ? "0.75rem" : 0 }}
                  >
                    <span className="text-xs font-mono text-primary-600 bg-primary-50 px-1 rounded">
                      {h.tag}
                    </span>
                    <span className="text-surface-800">{h.text}</span>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}

          {(raw as any).questionsToAnswer && (
            <ExpandableSection title="Questions to Answer" icon={Lightbulb}>
              <ul className="space-y-1">
                {((raw as any).questionsToAnswer as string[]).map((q, i) => (
                  <li key={i} className="text-sm text-surface-700">❓ {q}</li>
                ))}
              </ul>
            </ExpandableSection>
          )}
        </>
      )}

      {/* Content Optimization specifics */}
      {report.reportType === "content_optimization" && (raw as any).breakdown && (
        <ExpandableSection title="Score Breakdown" icon={BarChart3} defaultOpen>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries((raw as any).breakdown as Record<string, any>).map(
              ([key, val]: [string, any]) => (
                <div key={key} className="p-3 border border-surface-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-700 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className={`text-sm font-bold ${
                      val.score >= 80 ? "text-emerald-600" : val.score >= 60 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {val.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-surface-500">{val.details}</p>
                </div>
              )
            )}
          </div>
        </ExpandableSection>
      )}

      {/* Competitor Analysis specifics */}
      {report.reportType === "competitor_analysis" && (raw as any).competitorProfiles && (
        <>
          <ExpandableSection title="Competitor Profiles" icon={Users} defaultOpen>
            <div className="space-y-3">
              {((raw as any).competitorProfiles as any[]).map((cp: any, i: number) => (
                <div key={i} className="p-3 border border-surface-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <a
                      href={cp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-600 hover:underline flex items-center gap-1"
                    >
                      {cp.url} <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      cp.threatLevel === "high"
                        ? "bg-red-100 text-red-700"
                        : cp.threatLevel === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {cp.threatLevel} threat
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mb-2">
                    <strong>Differentiator:</strong> {cp.keyDifferentiator}
                  </p>
                </div>
              ))}
            </div>
          </ExpandableSection>

          {(raw as any).quickWins && (
            <ExpandableSection title="Quick Wins" icon={Zap}>
              <ul className="space-y-1">
                {((raw as any).quickWins as string[]).map((w, i) => (
                  <li key={i} className="text-sm text-surface-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚡</span> {w}
                  </li>
                ))}
              </ul>
            </ExpandableSection>
          )}
        </>
      )}

      {/* Full JSON (collapsed by default) */}
      <ExpandableSection title="Full AI Response (JSON)" icon={Code}>
        <pre className="p-3 bg-surface-900 text-emerald-400 rounded-lg text-xs overflow-x-auto max-h-[400px]">
          <code>{JSON.stringify(raw, null, 2)}</code>
        </pre>
      </ExpandableSection>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────

export function AiReportsPage() {
  const [activeTab, setActiveTab] = useState<string>("seo-report");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiReportData | null>(null);

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;

  const handleResult = (report: AiReportData) => {
    setResult(report);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary-600" />
          AI Intelligence
        </h1>
        <p className="text-surface-500 mt-1">
          AI-powered SEO reports, content briefs, optimization scoring, and competitor analysis
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setResult(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-surface-500 hover:text-surface-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <h3 className="text-lg font-semibold text-surface-900 mb-1">
            {activeTabConfig.label}
          </h3>
          <p className="text-sm text-surface-500 mb-4">{activeTabConfig.description}</p>

          {activeTab === "seo-report" && (
            <SeoReportForm onResult={handleResult} setLoading={setIsLoading} />
          )}
          {activeTab === "content-brief" && (
            <ContentBriefForm onResult={handleResult} setLoading={setIsLoading} />
          )}
          {activeTab === "content-score" && (
            <ContentScorerForm onResult={handleResult} setLoading={setIsLoading} />
          )}
          {activeTab === "competitor" && (
            <CompetitorForm onResult={handleResult} setLoading={setIsLoading} />
          )}
        </div>

        {/* Result */}
        <div className="card">
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                AI is thinking...
              </h3>
              <p className="text-sm text-surface-500">
                This may take 10-30 seconds depending on the analysis complexity.
              </p>
            </div>
          )}

          {!isLoading && !result && (
            <div className="text-center py-16 text-surface-400">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Fill in the form and click generate to see AI results here</p>
            </div>
          )}

          {!isLoading && result && <ReportResult report={result} />}
        </div>
      </div>
    </div>
  );
}
