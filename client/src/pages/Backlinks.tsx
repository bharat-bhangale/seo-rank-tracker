import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  Download, 
  Link as LinkIcon, 
  Loader2, 
  RefreshCw, 
  ShieldAlert,
  ShieldCheck, 
  TrendingUp, 
  Target
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
import { backlinksApi } from "@/lib/backlinksApi";

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: any; tone: string }) {
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

export function BacklinksPage() {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("example.com"); // Normally this would come from a project selector
  const [statusFilter, setStatusFilter] = useState("active");
  const [competitorsInput, setCompetitorsInput] = useState("");

  const statsQuery = useQuery({
    queryKey: ["backlinks-stats", domain],
    queryFn: () => backlinksApi.getStats(domain),
    enabled: Boolean(domain),
  });

  const backlinksQuery = useQuery({
    queryKey: ["backlinks", domain, statusFilter],
    queryFn: () => backlinksApi.getBacklinks({ domain, status: statusFilter, limit: 100 }),
    enabled: Boolean(domain),
  });

  const gapQuery = useQuery({
    queryKey: ["backlinks-gap", domain, competitorsInput],
    queryFn: () => backlinksApi.getCompetitorGap(domain, competitorsInput.split(",")),
    enabled: Boolean(domain) && Boolean(competitorsInput) && competitorsInput.split(",").length > 0,
  });

  const syncMutation = useMutation({
    mutationFn: () => backlinksApi.syncBacklinks(domain),
    onSuccess: () => {
      // In a real app we'd poll or wait for SSE, here we just show success and re-fetch later
      alert("Sync started in the background!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; disavowed?: boolean; toxicityStatus?: any }) => 
      backlinksApi.updateBacklink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backlinks", domain] });
    },
  });

  const chartData = useMemo(() => {
    return (statsQuery.data?.trend || []).map(stat => ({
      date: new Date(stat.date).toLocaleDateString(),
      total: stat.totalBacklinks,
      domains: stat.referringDomains
    }));
  }, [statsQuery.data]);

  const latestStats = statsQuery.data?.latestStats;
  const backlinks = backlinksQuery.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Backlink Intelligence</h1>
          <p className="text-surface-500 mt-1">
            Monitor backlink profile, identify toxic links, and find competitor opportunities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            className="input" 
            placeholder="Target domain..." 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <button 
            className="btn btn-primary"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !domain}
          >
            {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Now
          </button>
        </div>
      </div>

      {latestStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Backlinks"
            value={latestStats.totalBacklinks.toLocaleString()}
            icon={LinkIcon}
            tone="text-blue-600 bg-blue-50"
          />
          <StatCard
            label="Referring Domains"
            value={latestStats.referringDomains.toLocaleString()}
            icon={Target}
            tone="text-indigo-600 bg-indigo-50"
          />
          <StatCard
            label="Domain Rank"
            value={latestStats.domainRank}
            icon={TrendingUp}
            tone="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            label="Spam Score"
            value={latestStats.spamScore}
            icon={AlertTriangle}
            tone={latestStats.spamScore > 30 ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">Backlink Growth Trend</h2>
            {statsQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-600" />}
            {!statsQuery.isLoading && chartData.length > 0 && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" name="Total Links" stroke="#4f46e5" strokeWidth={2} />
                    <Line type="monotone" dataKey="domains" name="Ref. Domains" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {!statsQuery.isLoading && chartData.length === 0 && (
              <div className="h-[300px] flex items-center justify-center text-surface-500 text-sm">
                No trend data available for {domain}. Please sync to generate data.
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-surface-900">Backlink Profile & Toxicity</h2>
              <select 
                className="input text-sm w-auto" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="new">New</option>
                <option value="lost">Lost</option>
                <option value="toxic">Toxic</option>
                <option value="disavowed">Disavowed</option>
              </select>
            </div>
            
            {backlinksQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary-600 my-4" />}
            
            {!backlinksQuery.isLoading && backlinks.length === 0 && (
              <p className="text-sm text-surface-500 text-center py-4">No backlinks found matching filters.</p>
            )}

            {!backlinksQuery.isLoading && backlinks.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-surface-500 border-b border-surface-200">
                      <th className="py-2 pr-3 font-medium">Referring Page</th>
                      <th className="py-2 pr-3 font-medium">DA</th>
                      <th className="py-2 pr-3 font-medium">Toxicity</th>
                      <th className="py-2 pr-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backlinks.map(bl => (
                      <tr key={bl._id} className="border-b border-surface-100 hover:bg-surface-50">
                        <td className="py-3 pr-3">
                          <a href={bl.urlFrom} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline break-all truncate block max-w-[300px]">
                            {bl.urlFrom}
                          </a>
                          <p className="text-xs text-surface-500 mt-1">Anchor: "{bl.anchorText}"</p>
                        </td>
                        <td className="py-3 pr-3 font-medium">{bl.domainRank}</td>
                        <td className="py-3 pr-3">
                          {bl.toxicityStatus === "toxic" ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                              <ShieldAlert className="h-3 w-3" /> Toxic ({bl.spamScore})
                            </span>
                          ) : bl.toxicityStatus === "suspicious" ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                              <AlertTriangle className="h-3 w-3" /> Suspicious
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              <ShieldCheck className="h-3 w-3" /> Safe
                            </span>
                          )}
                          {bl.disavowed && (
                            <span className="ml-2 text-xs text-surface-500 line-through">Disavowed</span>
                          )}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button 
                            className="btn btn-ghost !px-2 text-xs"
                            onClick={() => updateMutation.mutate({ id: bl._id, disavowed: !bl.disavowed })}
                          >
                            {bl.disavowed ? "Restore" : "Disavow"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-surface-900">Disavow Generator</h2>
            </div>
            <p className="text-sm text-surface-600 mb-4">
              Generate a Google-formatted disavow file containing all domains you've marked as disavowed in the list.
            </p>
            <a 
              href={backlinksApi.getDisavowDownloadUrl(domain)}
              className="btn btn-outline w-full justify-center"
              download
            >
              <Download className="h-4 w-4" />
              Download disavow.txt
            </a>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">Competitor Link Gap</h2>
            <p className="text-sm text-surface-600 mb-3">
              Enter competitor domains (comma-separated) to find missing link opportunities.
            </p>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                className="input" 
                placeholder="comp1.com, comp2.com" 
                value={competitorsInput}
                onChange={(e) => setCompetitorsInput(e.target.value)}
              />
            </div>
            
            {gapQuery.isLoading && <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary-600" />}
            
            {!gapQuery.isLoading && gapQuery.data?.opportunities && gapQuery.data.opportunities.length > 0 && (
              <div className="space-y-3 mt-4">
                {gapQuery.data.opportunities.slice(0, 5).map(opp => (
                  <div key={opp.domain} className="p-3 bg-surface-50 rounded-lg border border-surface-200">
                    <p className="font-medium text-surface-900">{opp.domain}</p>
                    <p className="text-xs text-surface-500 mt-1">Links to {opp.count} competitors</p>
                  </div>
                ))}
              </div>
            )}
            {!gapQuery.isLoading && gapQuery.data?.opportunities && gapQuery.data.opportunities.length === 0 && (
              <p className="text-sm text-surface-500 text-center">No gap opportunities found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
