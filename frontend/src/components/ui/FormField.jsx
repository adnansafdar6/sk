/**
 * FormField — input with label, error, and helper text.
 */
export default function FormField({
  label,
  error,
  helper,
  required = false,
  children,
  className = "",
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium theme-text-secondary mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-xs theme-text-muted">{helper}</p>
      )}
    </div>
  );
}

/**
 * Pre-styled input component.
 */
export function Input({ className = "", ...props }) {
  return (
    <input
      className={`input-field ${className}`}
      {...props}
    />
  );
}

/**
 * Pre-styled textarea component.
 */
export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`input-field resize-none ${className}`}
      {...props}
    />
  );
}

/**
 * Pre-styled select component.
 */
export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`input-field ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
