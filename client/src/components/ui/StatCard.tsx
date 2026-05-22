import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  /** Tailwind text color class for the icon, e.g. "text-primary-600" */
  iconColor?: string;
  /** Tailwind bg color class for the icon container */
  iconBg?: string;
  /** Optional change indicator */
  change?: {
    value: number;
    type: "positive" | "negative" | "neutral";
  };
}

/**
 * KPI metric card used in Dashboard, SiteCrawler, and other overview pages.
 * Displays a labeled value with an icon and optional change indicator.
 */
export function StatCard({
  label,
  value,
  icon,
  iconColor = "text-primary-600",
  iconBg = "bg-primary-50",
  change,
}: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconColor} ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-sm text-surface-500">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-bold text-surface-900">{value}</p>
          {change && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                change.type === "positive"
                  ? "text-emerald-700 bg-emerald-100"
                  : change.type === "negative"
                    ? "text-red-700 bg-red-100"
                    : "text-surface-600 bg-surface-100"
              }`}
            >
              {change.type === "positive" ? "+" : ""}
              {change.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
