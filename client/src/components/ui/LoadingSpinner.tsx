import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  /** Height class for the container. Defaults to min-h-[60vh] */
  className?: string;
  /** Size of the spinner icon in pixels. Defaults to 32 (h-8 w-8) */
  size?: "sm" | "md" | "lg";
  /** Optional message below the spinner */
  message?: string;
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10",
} as const;

/**
 * Centralized loading spinner with optional message.
 * Replaces all ad-hoc `<Loader2 className="animate-spin" />` instances.
 */
export function LoadingSpinner({
  className = "min-h-[60vh]",
  size = "md",
  message,
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-primary-600`}
      />
      {message && (
        <p className="mt-3 text-sm text-surface-500">{message}</p>
      )}
    </div>
  );
}
