import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

/**
 * Reusable page header with title, optional description, and action slot.
 * Use `children` to render action buttons on the right side.
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
        {description && (
          <p className="text-surface-500 mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}
