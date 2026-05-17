import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Zap,
  Users,
  Eye,
  Target,
  Download,
  Loader2,
  Bell,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { analyticsApi } from "@/lib/analyticsApi";
import { exportApi } from "@/lib/exportApi";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const [domain, setDomain] = useState("");

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["dashboard-kpis", domain],
    queryFn: () => analyticsApi.getDashboard(domain),
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => analyticsApi.getNotifications(),
  });

  const handleExportKeywords = () => {
    exportApi.downloadKeywordsCsv(domain);
  };

  const handleExportBacklinks = () => {
    exportApi.downloadBacklinksCsv(domain);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500 mt-1">
            Welcome back! Here's your SEO overview.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            className="input w-full sm:w-64"
            placeholder="Filter by domain..."
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleExportKeywords} className="btn btn-secondary" title="Export Keywords CSV">
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">KWs</span>
            </button>
            <button onClick={handleExportBacklinks} className="btn btn-secondary" title="Export Backlinks CSV">
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Backlinks</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-xl text-primary-600 bg-primary-50">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Keywords Tracked</p>
                <p className="text-xl font-bold text-surface-900">{kpis?.totalKeywords || 0}</p>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-xl text-amber-600 bg-amber-50">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Avg. Position</p>
                <p className="text-xl font-bold text-surface-900">{kpis?.avgPosition || "—"}</p>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-xl text-emerald-600 bg-emerald-50">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Visibility Score</p>
                <p className="text-xl font-bold text-surface-900">{kpis?.visibilityScore?.toLocaleString() || 0}</p>
              </div>
            </div>

            <div className="card flex items-center gap-4">
              <div className="p-3 rounded-xl text-violet-600 bg-violet-50">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Top 10 Rankings</p>
                <p className="text-xl font-bold text-surface-900">{kpis?.keywordsInTop10 || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Top Movers */}
              <div className="card">
                <h2 className="text-lg font-semibold text-surface-900 mb-4">Top Movers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-emerald-600 mb-3 flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" /> Biggest Gains
                    </h3>
                    <div className="space-y-3">
                      {kpis?.topMovers.up.length ? (
                        kpis.topMovers.up.map((mover, i) => (
                          <div key={i} className="flex justify-between items-center bg-surface-50 p-2 rounded">
                            <span className="text-sm font-medium text-surface-800">{mover.keyword}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">#{mover.position}</span>
                              <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">+{mover.change}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-surface-400">No positive movement yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                      <ArrowDown className="h-4 w-4" /> Biggest Drops
                    </h3>
                    <div className="space-y-3">
                      {kpis?.topMovers.down.length ? (
                        kpis.topMovers.down.map((mover, i) => (
                          <div key={i} className="flex justify-between items-center bg-surface-50 p-2 rounded">
                            <span className="text-sm font-medium text-surface-800">{mover.keyword}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">#{mover.position}</span>
                              <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{mover.change}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-surface-400">No negative movement yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-lg font-semibold text-surface-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link to="/reports" className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
                    <Zap className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-surface-900 text-sm">Run SEO Audit</p>
                      <p className="text-xs text-surface-500">Analyze any website</p>
                    </div>
                  </Link>
                  <Link to="/rank-tracking" className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-surface-900 text-sm">Add Keywords</p>
                      <p className="text-xs text-surface-500">Track new keywords</p>
                    </div>
                  </Link>
                  <Link to="/websites" className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
                    <Users className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-medium text-surface-900 text-sm">Add Website</p>
                      <p className="text-xs text-surface-500">Monitor a new domain</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Activity Feed */}
              <div className="card h-full">
                <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-surface-500" />
                  Recent Notifications
                </h2>
                <div className="space-y-4">
                  {notifications?.length ? (
                    notifications.slice(0, 8).map((notif) => (
                      <div key={notif._id} className={`flex gap-3 pb-4 border-b border-surface-100 last:border-0 ${!notif.read ? "opacity-100" : "opacity-60"}`}>
                        <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${!notif.read ? "bg-primary-500" : "bg-surface-300"}`} />
                        <div>
                          <p className="text-sm font-medium text-surface-900">{notif.title}</p>
                          <p className="text-xs text-surface-500 mt-1">{notif.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-surface-500 text-center py-4">No recent activity.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
