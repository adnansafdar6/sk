/**
 * PageHeader — page title with optional subtitle and action buttons.
 */
export default function PageHeader({
  title,
  subtitle,
  children, // action buttons slot
  className = "",
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up ${className}`}>
      <div>
        <h1 className="text-2xl font-bold theme-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm theme-text-secondary mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
