import { useState } from "react";
import api from "@/lib/api";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Globe,
  ExternalLink,
  Clock,
  BarChart3,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface CheckResult {
  name: string;
  category: string;
  score: number;
  maxScore: number;
  severity: "critical" | "warning" | "info" | "pass";
  message: string;
  details?: Record<string, unknown>;
}

interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  checksCount: number;
  criticalCount: number;
  warningCount: number;
}

interface PageData {
  url: string;
  finalUrl: string;
  statusCode: number;
  contentLength: number;
  loadTimeMs: number;
  isHttps: boolean;
  title?: string;
  description?: string;
  h1?: string;
}

interface AuditResult {
  _id: string;
  url: string;
  overallScore: number;
  grade: string;
  categoryScores: CategoryScore[];
  checks: CheckResult[];
  pageData: PageData;
  status: string;
  createdAt: string;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Info",
  },
  pass: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Pass",
  },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof BarChart3 }> = {
  onPage: { label: "On-Page SEO", icon: FileText },
  technical: { label: "Technical SEO", icon: ShieldCheck },
  performance: { label: "Performance", icon: BarChart3 },
  content: { label: "Content Quality", icon: Globe },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 60) return "stroke-amber-500";
  return "stroke-red-500";
}

function getGradeBg(grade: string): string {
  if (grade === "A+" || grade === "A") return "bg-emerald-500";
  if (grade === "B") return "bg-blue-500";
  if (grade === "C") return "bg-amber-500";
  return "bg-red-500";
}

/**
 * Circular score gauge component.
 */
function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-surface-200"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${getScoreRingColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${getGradeBg(grade)}`}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}

export function AnalyzerPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);
    setActiveCategory(null);

    try {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith("http")) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      const response = await api.post("/analyzer/audit", { url: normalizedUrl });
      setResult(response.data.data.audit);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to run audit. Please check the URL and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChecks = result
    ? activeCategory
      ? result.checks.filter((c) => c.category === activeCategory)
      : result.checks
    : [];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">SEO Analyzer</h1>
        <p className="text-surface-500 mt-1">
          Run a comprehensive SEO audit on any URL
        </p>
      </div>

      {/* URL Input */}
      <form onSubmit={handleSubmit} className="card mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Enter website URL (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary px-6 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Audit
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
            {error}
          </div>
        )}
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="card text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-surface-900 mb-1">
            Analyzing your website...
          </h3>
          <p className="text-surface-500">
            Running 15 SEO checks. This usually takes 5-10 seconds.
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score Overview */}
          <div className="card">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ScoreGauge score={result.overallScore} grade={result.grade} />

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold text-surface-900 mb-1">
                  Overall SEO Score
                </h2>
                <a
                  href={result.pageData.finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary-600 text-sm hover:underline mb-3"
                >
                  {result.pageData.finalUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="flex flex-wrap gap-4 text-sm text-surface-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {result.pageData.loadTimeMs}ms load time
                  </span>
                  <span>
                    Status: {result.pageData.statusCode}
                  </span>
                  <span>
                    Size: {(result.pageData.contentLength / 1024).toFixed(1)}KB
                  </span>
                  <span>
                    HTTPS: {result.pageData.isHttps ? "✅" : "❌"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.categoryScores.map((cs) => {
              const config = CATEGORY_CONFIG[cs.category];
              const Icon = config?.icon || BarChart3;
              const isActive = activeCategory === cs.category;

              return (
                <button
                  key={cs.category}
                  onClick={() =>
                    setActiveCategory(isActive ? null : cs.category)
                  }
                  className={`card text-left transition-all hover:shadow-md ${
                    isActive ? "ring-2 ring-primary-500 border-primary-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary-50">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-surface-600">
                      {config?.label || cs.category}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className={`text-2xl font-bold ${getScoreColor(cs.score)}`}>
                      {cs.score}
                    </span>
                    <span className="text-xs text-surface-400">
                      {cs.checksCount} checks
                      {cs.criticalCount > 0 && (
                        <span className="text-red-500 ml-1">
                          • {cs.criticalCount} critical
                        </span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Checks */}
          <div className="card">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">
              {activeCategory
                ? `${CATEGORY_CONFIG[activeCategory]?.label || activeCategory} Checks`
                : "All Checks"}
              <span className="text-sm font-normal text-surface-500 ml-2">
                ({filteredChecks.length} checks)
              </span>
            </h3>

            <div className="space-y-3">
              {filteredChecks
                .sort((a, b) => a.score - b.score) // Show worst first
                .map((check, i) => {
                  const config = SEVERITY_CONFIG[check.severity];
                  const SevIcon = config.icon;

                  return (
                    <div
                      key={`${check.name}-${i}`}
                      className={`p-4 rounded-lg border ${config.border} ${config.bg}`}
                    >
                      <div className="flex items-start gap-3">
                        <SevIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-medium text-surface-900 text-sm">
                              {check.name
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color} border ${config.border}`}
                              >
                                {config.label}
                              </span>
                              <span className={`text-sm font-semibold ${getScoreColor(check.score)}`}>
                                {check.score}/{check.maxScore}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-surface-600">{check.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
