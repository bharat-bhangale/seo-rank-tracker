import { BarChart3, Globe, TrendingUp, FileText, Zap, Users } from "lucide-react";

/**
 * Dashboard home page with KPI summary cards and quick actions.
 * This is a shell — actual data will be wired in Phase 7.
 */
export function DashboardPage() {
  const stats = [
    { label: "Keywords Tracked", value: "0", icon: TrendingUp, color: "text-primary-600 bg-primary-50" },
    { label: "Websites", value: "0", icon: Globe, color: "text-emerald-600 bg-emerald-50" },
    { label: "Avg. Position", value: "—", icon: BarChart3, color: "text-amber-600 bg-amber-50" },
    { label: "Reports Generated", value: "0", icon: FileText, color: "text-violet-600 bg-violet-50" },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-500 mt-1">
          Welcome back! Here's your SEO overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">{stat.label}</p>
                <p className="text-xl font-bold text-surface-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-surface-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
            <Zap className="h-5 w-5 text-primary-600" />
            <div>
              <p className="font-medium text-surface-900 text-sm">Run SEO Audit</p>
              <p className="text-xs text-surface-500">Analyze any website</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <div>
              <p className="font-medium text-surface-900 text-sm">Add Keywords</p>
              <p className="text-xs text-surface-500">Track new keywords</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
            <Users className="h-5 w-5 text-primary-600" />
            <div>
              <p className="font-medium text-surface-900 text-sm">Add Website</p>
              <p className="text-xs text-surface-500">Monitor a new domain</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
