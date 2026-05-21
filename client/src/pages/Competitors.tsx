import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { competitorsApi } from "@/lib/competitorsApi";
import {
  Swords,
  Loader2,
  Plus,
  X,
  TrendingUp,
  Target,
  CheckCircle,
} from "lucide-react";

export function CompetitorsPage() {
  const [websiteId, setWebsiteId] = useState("");
  const [domains, setDomains] = useState<string[]>([""]);
  const [analysisType, setAnalysisType] = useState<"full" | "content_gap" | "keyword_gap" | "backlink_gap">("full");
  const [latestReport, setLatestReport] = useState<any>(null);

  // Fetch existing reports
  const { data: reportsData } = useQuery({
    queryKey: ["competitor-reports", websiteId],
    queryFn: () => competitorsApi.getReports(websiteId, { limit: 5 }),
    enabled: !!websiteId,
    select: (res) => res.data,
  });

  // Run analysis
  const analyze = useMutation({
    mutationFn: () =>
      competitorsApi.analyze({
        websiteId,
        competitorDomains: domains.filter((d) => d.trim()),
        analysisType,
      }),
    onSuccess: (res) => {
      setLatestReport(res.data.data.report);
      toast.success("Competitor analysis complete!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Analysis failed");
    },
  });

  const addDomain = () => {
    if (domains.length < 5) setDomains([...domains, ""]);
  };

  const removeDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
  };

  const updateDomain = (index: number, value: string) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    setDomains(newDomains);
  };

  const validDomains = domains.filter((d) => d.trim()).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Competitor Analysis</h1>
        <p className="text-surface-500 mt-1">
          AI-powered analysis of your competitors' SEO strategies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">
              Configure Analysis
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Your Website ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Select website"
                  value={websiteId}
                  onChange={(e) => setWebsiteId(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Competitor Domains</label>
                <div className="space-y-2">
                  {domains.map((domain, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        className="input"
                        placeholder={`competitor${i + 1}.com`}
                        value={domain}
                        onChange={(e) => updateDomain(i, e.target.value)}
                      />
                      {domains.length > 1 && (
                        <button
                          onClick={() => removeDomain(i)}
                          className="p-2 text-surface-400 hover:text-danger-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {domains.length < 5 && (
                  <button onClick={addDomain} className="btn btn-ghost text-xs mt-2">
                    <Plus className="h-3.5 w-3.5" />
                    Add Competitor
                  </button>
                )}
              </div>

              <div>
                <label className="label">Analysis Type</label>
                <select
                  className="input"
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value as any)}
                >
                  <option value="full">Full Analysis</option>
                  <option value="content_gap">Content Gap</option>
                  <option value="keyword_gap">Keyword Gap</option>
                  <option value="backlink_gap">Backlink Gap</option>
                </select>
              </div>

              <button
                onClick={() => analyze.mutate()}
                disabled={!websiteId || validDomains === 0 || analyze.isPending}
                className="btn btn-primary w-full"
              >
                {analyze.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Swords className="h-4 w-4" />
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Previous Reports */}
          {reportsData?.data && reportsData.data.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
                Previous Analyses
              </h3>
              <div className="space-y-2">
                {reportsData.data.map((report: any) => (
                  <button
                    key={report._id}
                    onClick={() => setLatestReport(report)}
                    className="w-full text-left p-2 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-surface-900 truncate">
                      {report.url}
                    </p>
                    <p className="text-xs text-surface-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {latestReport ? (
            <div className="space-y-4">
              {/* Executive Summary */}
              {latestReport.executiveSummary && (
                <div className="card border-l-4 border-l-primary-500">
                  <h3 className="font-semibold text-surface-900 mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary-600" />
                    Executive Summary
                  </h3>
                  <p className="text-sm text-surface-700 leading-relaxed">
                    {latestReport.executiveSummary}
                  </p>
                </div>
              )}

              {/* Strengths */}
              {latestReport.strengths?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success-500" />
                    Your Strengths
                  </h3>
                  <ul className="space-y-2">
                    {latestReport.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
                        <CheckCircle className="h-4 w-4 text-success-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {latestReport.contentRecommendations?.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-surface-900 mb-3">
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {latestReport.contentRecommendations.map((r: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-surface-700"
                      >
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
                          {i + 1}
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw AI Response */}
              {latestReport.rawResponse && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
                    Full Analysis Data
                  </h3>
                  <div className="bg-surface-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <pre className="text-xs text-surface-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(latestReport.rawResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Swords className="h-12 w-12 text-surface-300 mb-3" />
              <h3 className="text-lg font-medium text-surface-700">
                No analysis selected
              </h3>
              <p className="text-sm text-surface-500 mt-1">
                Configure and run a competitor analysis to see AI-powered insights
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
