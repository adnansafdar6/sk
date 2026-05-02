/**
 * StatCard — dashboard metric cards with icon, value, and trend.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "primary",
  delay = 0,
}) {
  const gradientMap = {
    primary: "from-primary-500 to-primary-700",
    success: "from-emerald-500 to-emerald-700",
    warning: "from-amber-500 to-amber-700",
    danger: "from-red-500 to-red-700",
    info: "from-blue-500 to-blue-700",
  };

  return (
    <div
      className="card rounded-2xl p-6 hover:glow transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium theme-text-secondary uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradientMap[color]} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold theme-text mb-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-sm theme-text-muted">{subtitle}</p>
      )}
    </div>
  );
}
