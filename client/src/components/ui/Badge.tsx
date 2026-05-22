interface BadgeProps {
  children: React.ReactNode;
  /** Visual variant. Defaults to "default" */
  variant?: "default" | "success" | "warning" | "danger" | "primary";
  /** Optional additional class names */
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "badge-default",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  primary: "badge-primary",
};

/**
 * Status badge component for labels, tags, and status indicators.
 * Uses the CSS badge classes from the design system.
 */
export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
