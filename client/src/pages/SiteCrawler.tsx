import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { siteCrawlerApi, type CrawlResult, type CrawledPage } from "@/lib/siteCrawlerApi";
import {
  Globe,
  Play,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LinkIcon,
  FileWarning,
  RefreshCw,
} from "lucide-react";

export function SiteCrawlerPage() {
  const queryClient = useQueryClient();
  const [websiteId, setWebsiteId] = useState("");
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxPages, setMaxPages] = useState(100);
  const [selectedCrawlId, setSelectedCrawlId] = useState<string | null>(null);
  const [showPages, setShowPages] = useState(false);

  // Fetch crawl history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["crawl-history"],
    queryFn: () => siteCrawlerApi.getCrawlHistory({ limit: 10 }),
    select: (res) => res.data,
  });

  // Fetch selected crawl details
  const { data: crawlData } = useQuery({
    queryKey: ["crawl", selectedCrawlId],
    queryFn: () => siteCrawlerApi.getCrawl(selectedCrawlId!),
    enabled: !!selectedCrawlId,
    select: (res) => res.data.data.crawl as CrawlResult,
    refetchInterval: (query) => {
      const crawl = query.state.data as CrawlResult | undefined;
      return crawl && (crawl.status === "pending" || crawl.status === "crawling") ? 5000 : false;
    },
  });

  // Fetch crawled pages
  const { data: pagesData } = useQuery({
    queryKey: ["crawl-pages", selectedCrawlId],
    queryFn: () => siteCrawlerApi.getCrawlPages(selectedCrawlId!, { limit: 100 }),
    enabled: !!selectedCrawlId && showPages,
    select: (res) => res.data,
  });

  // Start crawl mutation
  const startCrawl = useMutation({
    mutationFn: () =>
      siteCrawlerApi.startCrawl({
        websiteId,
        maxDepth,
        maxPages,
      }),
    onSuccess: (res) => {
      const crawl = res.data.data.crawl;
      setSelectedCrawlId(crawl._id);
      toast.success("Crawl started! This may take a few minutes.");
      queryClient.invalidateQueries({ queryKey: ["crawl-history"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to start crawl");
    },
  });

  const crawls = historyData?.data || [];
  const summary = crawlData?.summary;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Site Crawler</h1>
          <p className="text-surface-500 mt-1">
            Deep crawl your website to find technical SEO issues across all pages
          </p>
        </div>
      </div>

      {/* Start Crawl Form */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Start New Crawl</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="label">Website ID</label>
            <input
              type="text"
              className="input"
              placeholder="Enter website ID"
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Max Depth</label>
            <input
              type="number"
              className="input"
              min={1}
              max={10}
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Max Pages</label>
            <input
              type="number"
              className="input"
              min={1}
              max={10000}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => startCrawl.mutate()}
              disabled={!websiteId || startCrawl.isPending}
              className="btn btn-primary w-full"
            >
              {startCrawl.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Crawl
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crawl History */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
              Crawl History
            </h3>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : crawls.length === 0 ? (
              <p className="text-surface-500 text-sm py-4">No crawls yet. Start your first crawl above.</p>
            ) : (
              <div className="space-y-2">
                {crawls.map((crawl: CrawlResult) => (
                  <button
                    key={crawl._id}
                    onClick={() => {
                      setSelectedCrawlId(crawl._id);
                      setShowPages(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedCrawlId === crawl._id
                        ? "border-primary-300 bg-primary-50"
                        : "border-surface-200 hover:bg-surface-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-surface-400" />
                      <span className="text-sm font-medium text-surface-900 truncate">
                        {crawl.domain}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={crawl.status} />
                      <span className="text-xs text-surface-400">
                        {new Date(crawl.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Crawl Results */}
        <div className="lg:col-span-2">
          {crawlData ? (
            <div className="space-y-4">
              {/* Progress bar if crawling */}
              {(crawlData.status === "pending" || crawlData.status === "crawling") && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary-600" />
                    <span className="text-sm font-medium">
                      Crawling... {crawlData.progress.crawledPages} pages found
                    </span>
                  </div>
                  <div className="w-full bg-surface-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${crawlData.progress.percentComplete}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              {summary && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryCard
                      label="Health Score"
                      value={`${summary.healthScore}/100`}
                      icon={<CheckCircle className="h-5 w-5" />}
                      color={summary.healthScore >= 70 ? "text-success-500" : summary.healthScore >= 40 ? "text-warning-500" : "text-danger-500"}
                    />
                    <SummaryCard
                      label="Pages Crawled"
                      value={String(summary.totalPages)}
                      icon={<Globe className="h-5 w-5" />}
                      color="text-primary-600"
                    />
                    <SummaryCard
                      label="Broken Links"
                      value={String(summary.brokenLinksCount)}
                      icon={<LinkIcon className="h-5 w-5" />}
                      color={summary.brokenLinksCount > 0 ? "text-danger-500" : "text-success-500"}
                    />
                    <SummaryCard
                      label="Issues"
                      value={String(
                        summary.missingTitles +
                          summary.missingDescriptions +
                          summary.orphanPagesCount
                      )}
                      icon={<FileWarning className="h-5 w-5" />}
                      color="text-warning-500"
                    />
                  </div>

                  {/* Issue breakdown */}
                  <div className="card">
                    <h3 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
                      Issue Breakdown
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <IssueRow label="Missing Titles" count={summary.missingTitles} />
                      <IssueRow label="Missing Descriptions" count={summary.missingDescriptions} />
                      <IssueRow label="Missing H1" count={summary.missingH1} />
                      <IssueRow label="Duplicate Titles" count={summary.duplicateTitlesCount} />
                      <IssueRow label="Duplicate Descriptions" count={summary.duplicateDescriptionsCount} />
                      <IssueRow label="Orphan Pages" count={summary.orphanPagesCount} />
                      <IssueRow label="Redirect Chains" count={summary.redirectChainsCount} />
                      <IssueRow
                        label="Avg Load Time"
                        count={summary.averageLoadTimeMs}
                        suffix="ms"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Pages toggle */}
              {crawlData.status === "completed" && (
                <div className="card">
                  <button
                    onClick={() => setShowPages(!showPages)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    {showPages ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-semibold text-surface-700">
                      {showPages ? "Hide" : "Show"} Crawled Pages
                    </span>
                  </button>

                  {showPages && pagesData?.data && (
                    <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
                      {pagesData.data.map((page: CrawledPage, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded border border-surface-100 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                page.statusCode === 200
                                  ? "bg-green-100 text-green-700"
                                  : page.statusCode >= 400
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {page.statusCode}
                            </span>
                            <span className="truncate text-surface-700">{page.url}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            {page.issues.length > 0 && (
                              <span className="text-xs text-warning-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {page.issues.length}
                              </span>
                            )}
                            <span className="text-xs text-surface-400">{page.loadTimeMs}ms</span>
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-surface-400 hover:text-primary-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Globe className="h-12 w-12 text-surface-300 mb-3" />
              <h3 className="text-lg font-medium text-surface-700">Select a crawl</h3>
              <p className="text-sm text-surface-500 mt-1">
                Choose from history or start a new crawl to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    crawling: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || ""}`}>
      {status}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <div className={color}>{icon}</div>
      <div>
        <p className="text-xs text-surface-500">{label}</p>
        <p className="text-lg font-bold text-surface-900">{value}</p>
      </div>
    </div>
  );
}

function IssueRow({
  label,
  count,
  suffix = "",
}: {
  label: string;
  count: number;
  suffix?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="text-surface-600">{label}</span>
      <span
        className={`font-semibold ${count > 0 && !suffix ? "text-warning-500" : "text-surface-900"}`}
      >
        {count}
        {suffix}
      </span>
    </div>
  );
}
