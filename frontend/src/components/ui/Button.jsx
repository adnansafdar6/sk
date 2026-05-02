/**
 * Button — reusable button with variants, sizes, loading state.
 */
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg hover:shadow-primary-500/25 hover:from-primary-500 hover:to-primary-400",
  secondary:
    "bg-(--bg-input) theme-text border theme-border hover:border-(--border-hover) hover:bg-(--bg-card-hover)",
  danger:
    "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:shadow-red-500/25",
  ghost:
    "theme-text-secondary hover:theme-text hover:bg-(--bg-input)",
  outline:
    "border theme-border theme-text hover:bg-(--bg-input) hover:border-(--border-hover)",
};

const sizes = {
  xs: "px-2.5 py-1 text-xs rounded-lg gap-1",
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight className="w-4 h-4" />}
    </button>
  );
}
