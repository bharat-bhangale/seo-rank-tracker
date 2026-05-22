import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Reusable empty state placeholder with icon, title, description, and optional action.
 * Use when a list/table has no data to display.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-surface-300 mb-3">{icon}</div>
      <h3 className="text-lg font-medium text-surface-700">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
