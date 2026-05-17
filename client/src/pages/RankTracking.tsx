import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type Keyword,
  type NewKeywordInput,
  rankTrackingApi,
} from "@/lib/rankTrackingApi";

const defaultKeywordForm: NewKeywordInput = {
  domain: "",
  keyword: "",
  locale: "en-US",
  device: "desktop",
  group: "",
  tags: [],
  schedule: {
    enabled: true,
    cron: "0 3 * * *",
    timezone: "UTC",
  },
};

const getApiError = (error: unknown): string => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) return response.data.error;
  }

  return error instanceof Error ? error.message : "Something went wrong.";
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-surface-500">{label}</p>
        <p className="text-xl font-bold text-surface-900">{value}</p>
      </div>
    </div>
  );
}

function KeywordForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultKeywordForm);
  const [tagsText, setTagsText] = useState("");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: rankTrackingApi.createKeyword,
    onSuccess: () => {
      setForm(defaultKeywordForm);
      setTagsText("");
      setError("");
      void queryClient.invalidateQueries({ queryKey: ["rank-keywords"] });
    },
    onError: (mutationError) => setError(getApiError(mutationError)),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate({
      ...form,
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-surface-900">Add Keyword</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Domain</label>
          <input
            className="input"
            placeholder="example.com"
            value={form.domain}
            onChange={(event) => setForm({ ...form, domain: event.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Keyword</label>
          <input
            className="input"
            placeholder="best seo tools"
            value={form.keyword}
            onChange={(event) => setForm({ ...form, keyword: event.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Locale</label>
          <input
            className="input"
            value={form.locale}
            onChange={(event) => setForm({ ...form, locale: event.target.value })}
          />
        </div>
        <div>
          <label className="label">Device</label>
          <select
            className="input"
            value={form.device}
            onChange={(event) =>
              setForm({ ...form, device: event.target.value as "desktop" | "mobile" })
            }
          >
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>
        <div>
          <label className="label">Group</label>
          <input
            className="input"
            placeholder="Product pages"
            value={form.group}
            onChange={(event) => setForm({ ...form, group: event.target.value })}
          />
        </div>
        <div>
          <label className="label">Tags</label>
          <input
            className="input"
            placeholder="priority, blog, local"
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex items-center gap-2 text-sm text-surface-700">
          <input
            type="checkbox"
            checked={form.schedule.enabled}
            onChange={(event) =>
              setForm({
                ...form,
                schedule: { ...form.schedule, enabled: event.target.checked },
              })
            }
          />
          Daily automation
        </label>
        <input
          className="input"
          value={form.schedule.cron}
          onChange={(event) =>
            setForm({
              ...form,
              schedule: { ...form.schedule, cron: event.target.value },
            })
          }
          aria-label="Cron expression"
        />
        <input
          className="input"
          value={form.schedule.timezone}
          onChange={(event) =>
            setForm({
              ...form,
              schedule: { ...form.schedule, timezone: event.target.value },
            })
          }
          aria-label="Timezone"
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
        {createMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add keyword
      </button>
    </form>
  );
}

function BulkImportPanel() {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState(
    "domain,keyword,locale,device,group,tags\nexample.com,best seo tools,en-US,desktop,Core,priority;tools"
  );
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: rankTrackingApi.bulkImport,
    onSuccess: (result) => {
      setMessage(`Imported ${result.imported}; skipped ${result.skipped}.`);
      void queryClient.invalidateQueries({ queryKey: ["rank-keywords"] });
    },
    onError: (error) => setMessage(getApiError(error)),
  });

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-surface-900">CSV Import</h2>
      </div>
      <textarea
        className="input min-h-[120px] font-mono text-xs"
        value={csvText}
        onChange={(event) => setCsvText(event.target.value)}
      />
      {message && <p className="text-sm text-surface-600">{message}</p>}
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => mutation.mutate(csvText)}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Import CSV
      </button>
    </div>
  );
}

function KeywordsTable({
  keywords,
  selectedKeywordId,
  onSelect,
}: {
  keywords: Keyword[];
  selectedKeywordId?: string;
  onSelect: (keywordId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState("");

  const checkMutation = useMutation({
    mutationFn: rankTrackingApi.queueRankCheck,
    onSuccess: () => {
      setActionError("");
      void queryClient.invalidateQueries({ queryKey: ["rank-keywords"] });
    },
    onError: (error) => setActionError(getApiError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: rankTrackingApi.deleteKeyword,
    onSuccess: () => {
      setActionError("");
      void queryClient.invalidateQueries({ queryKey: ["rank-keywords"] });
    },
    onError: (error) => setActionError(getApiError(error)),
  });

  if (keywords.length === 0) {
    return (
      <div className="card text-center py-12">
        <Search className="h-10 w-10 text-surface-300 mx-auto mb-3" />
        <p className="text-sm text-surface-500">No tracked keywords yet.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-surface-900">Tracked Keywords</h2>
        <span className="text-sm text-surface-500">{keywords.length} keywords</span>
      </div>

      {actionError && <p className="error-text mb-3">{actionError}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-surface-500 border-b border-surface-200">
              <th className="py-2 pr-3 font-medium">Keyword</th>
              <th className="py-2 pr-3 font-medium">Domain</th>
              <th className="py-2 pr-3 font-medium">Rank</th>
              <th className="py-2 pr-3 font-medium">Settings</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((keyword) => {
              const isSelected = selectedKeywordId === keyword._id;
              return (
                <tr
                  key={keyword._id}
                  className={`border-b border-surface-100 ${
                    isSelected ? "bg-primary-50" : "hover:bg-surface-50"
                  }`}
                >
                  <td className="py-3 pr-3">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => onSelect(keyword._id)}
                    >
                      <span className="font-medium text-surface-900">
                        {keyword.keyword}
                      </span>
                      {keyword.group && (
                        <span className="block text-xs text-surface-500">
                          {keyword.group}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 pr-3 text-surface-600">{keyword.domain}</td>
                  <td className="py-3 pr-3">
                    {keyword.lastPosition ? (
                      <span className="font-semibold text-surface-900">
                        #{keyword.lastPosition}
                      </span>
                    ) : (
                      <span className="text-surface-400">Not checked</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-surface-500">
                    {keyword.locale} / {keyword.device}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-surface-100 text-surface-700">
                      <Clock className="h-3 w-3" />
                      {keyword.lastCheckStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pl-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost !px-2"
                        onClick={() => checkMutation.mutate(keyword._id)}
                        disabled={checkMutation.isPending}
                        title="Queue rank check"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost !px-2 text-danger-500"
                        onClick={() => deleteMutation.mutate(keyword._id)}
                        disabled={deleteMutation.isPending}
                        title="Delete keyword"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendPanel({ keywordId }: { keywordId?: string }) {
  const trendQuery = useQuery({
    queryKey: ["rank-trend", keywordId],
    queryFn: () => rankTrackingApi.getTrend(keywordId || ""),
    enabled: Boolean(keywordId),
  });

  const chartData = useMemo(
    () =>
      (trendQuery.data || []).map((check) => ({
        date: new Date(check.checkedAt).toLocaleDateString(),
        position: check.position || 101,
        source: check.source,
      })),
    [trendQuery.data]
  );

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Ranking Trend</h2>
      {!keywordId && <p className="text-sm text-surface-500">Select a keyword to view trend data.</p>}
      {keywordId && trendQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
      {keywordId && !trendQuery.isLoading && chartData.length === 0 && (
        <p className="text-sm text-surface-500">No rank history yet.</p>
      )}
      {chartData.length > 0 && (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis reversed domain={[1, 101]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="position"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AlertsPanel() {
  const alertsQuery = useQuery({
    queryKey: ["rank-alerts"],
    queryFn: rankTrackingApi.getAlerts,
  });

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Rank Alerts</h2>
      {alertsQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
      {!alertsQuery.isLoading && (alertsQuery.data?.alerts.length || 0) === 0 && (
        <p className="text-sm text-surface-500">No movement alerts yet.</p>
      )}
      <div className="space-y-3">
        {(alertsQuery.data?.alerts || []).map((alert) => (
          <div key={alert._id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-50">
            {alert.type.includes("loss") ? (
              <TrendingDown className="h-5 w-5 text-amber-600" />
            ) : (
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            )}
            <div>
              <p className="text-sm font-medium text-surface-900">{alert.message}</p>
              <p className="text-xs text-surface-500">
                {new Date(alert.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureAndVisibilityPanel({ domain }: { domain?: string }) {
  const featureQuery = useQuery({
    queryKey: ["rank-feature-summary"],
    queryFn: rankTrackingApi.getFeatureSummary,
  });
  const aiQuery = useQuery({
    queryKey: ["rank-ai-visibility", domain],
    queryFn: () => rankTrackingApi.getAiVisibility(domain),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">SERP Features</h2>
        {featureQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
        <div className="space-y-2">
          {(featureQuery.data || []).slice(0, 8).map((row) => (
            <div
              key={`${row._id.type}-${row._id.owned}`}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-surface-700">
                {row._id.type.replaceAll("_", " ")}
                {row._id.owned ? " owned" : " observed"}
              </span>
              <span className="font-semibold text-surface-900">{row.count}</span>
            </div>
          ))}
          {!featureQuery.isLoading && (featureQuery.data || []).length === 0 && (
            <p className="text-sm text-surface-500">No SERP feature data yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">AI Visibility</h2>
        {aiQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
        {aiQuery.data && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-surface-50">
              <Bot className="h-5 w-5 text-primary-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-surface-900">
                {aiQuery.data.aiOverviewPresent}
              </p>
              <p className="text-xs text-surface-500">AI Overviews</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-50">
              <Sparkles className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-surface-900">
                {aiQuery.data.citesDomain}
              </p>
              <p className="text-xs text-surface-500">Citations</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-50">
              <CheckCircle2 className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-surface-900">
                {(aiQuery.data.citationRate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-surface-500">Rate</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GeoGridPanel({ keywordId }: { keywordId?: string }) {
  const geoQuery = useQuery({
    queryKey: ["rank-geo-grid", keywordId],
    queryFn: () => rankTrackingApi.getGeoGrid(keywordId || ""),
    enabled: Boolean(keywordId),
  });

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-surface-900 mb-4">Local Geo-Grid</h2>
      {!keywordId && <p className="text-sm text-surface-500">Select a keyword to view geo-grid results.</p>}
      {keywordId && geoQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {(geoQuery.data || []).slice(0, 9).map((check) => (
          <div key={check._id} className="p-3 rounded-lg bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-1 text-xs text-surface-500 mb-1">
              <MapPin className="h-3 w-3" />
              {check.location?.latitude}, {check.location?.longitude}
            </div>
            <p className="text-lg font-bold text-surface-900">
              {check.position ? `#${check.position}` : "100+"}
            </p>
          </div>
        ))}
      </div>
      {keywordId && !geoQuery.isLoading && (geoQuery.data || []).length === 0 && (
        <p className="text-sm text-surface-500">No geo-grid checks have completed yet.</p>
      )}
    </div>
  );
}

export function RankTrackingPage() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | undefined>();
  const keywordsQuery = useQuery({
    queryKey: ["rank-keywords"],
    queryFn: rankTrackingApi.listKeywords,
  });

  const keywords = keywordsQuery.data?.keywords || [];
  const selectedKeyword = keywords.find((keyword) => keyword._id === selectedKeywordId) || keywords[0];
  const averageRank = useMemo(() => {
    const ranked = keywords.filter((keyword) => keyword.lastPosition);
    if (ranked.length === 0) return "N/A";
    const total = ranked.reduce((sum, keyword) => sum + (keyword.lastPosition || 0), 0);
    return (total / ranked.length).toFixed(1);
  }, [keywords]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Rank Tracking</h1>
        <p className="text-surface-500 mt-1">
          Monitor daily keyword rankings, SERP features, local visibility, and AI citations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Keywords"
          value={String(keywords.length)}
          icon={Search}
          tone="text-primary-600 bg-primary-50"
        />
        <StatCard
          label="Average Rank"
          value={averageRank}
          icon={TrendingUp}
          tone="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          label="Queued/Checking"
          value={String(
            keywords.filter((keyword) =>
              ["queued", "checking"].includes(keyword.lastCheckStatus)
            ).length
          )}
          icon={Clock}
          tone="text-amber-600 bg-amber-50"
        />
        <StatCard
          label="Failed Checks"
          value={String(keywords.filter((keyword) => keyword.lastCheckStatus === "failed").length)}
          icon={AlertTriangle}
          tone="text-red-600 bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)] gap-6">
        <div className="space-y-6">
          {keywordsQuery.isLoading ? (
            <div className="card">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <KeywordsTable
              keywords={keywords}
              selectedKeywordId={selectedKeyword?._id}
              onSelect={setSelectedKeywordId}
            />
          )}
          <TrendPanel keywordId={selectedKeyword?._id} />
          <FeatureAndVisibilityPanel domain={selectedKeyword?.domain} />
          <GeoGridPanel keywordId={selectedKeyword?._id} />
        </div>
        <div className="space-y-6">
          <KeywordForm />
          <BulkImportPanel />
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
