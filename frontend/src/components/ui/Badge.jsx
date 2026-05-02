/**
 * Badge — colored status/role badges.
 */
const colorMap = {
  primary: "bg-primary-600/15 text-primary-400 border-primary-500/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  danger: "bg-red-500/15 text-red-400 border-red-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  neutral: "bg-(--bg-input) theme-text-secondary theme-border",
};

const sizeMap = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export default function Badge({
  children,
  color = "primary",
  size = "md",
  dot = false,
  className = "",
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-md border
        ${colorMap[color]} ${sizeMap[size]} ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            color === "success" ? "bg-emerald-400" :
            color === "danger" ? "bg-red-400" :
            color === "warning" ? "bg-amber-400" :
            color === "info" ? "bg-blue-400" :
            color === "primary" ? "bg-primary-400" :
            "bg-(--text-muted)"
          }`}
        />
      )}
      {children}
    </span>
  );
}
