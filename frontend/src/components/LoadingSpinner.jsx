/**
 * LoadingSpinner — full-screen loading indicator.
 */
export default function LoadingSpinner({ size = "lg", fullScreen = true }) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-2 border-surface-700 border-t-primary-400 rounded-full animate-spin`}
    />
  );

  if (!fullScreen) return spinner;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {spinner}
        <p className="text-surface-200/60 text-sm tracking-wide animate-pulse-soft">
          Loading...
        </p>
      </div>
    </div>
  );
}
