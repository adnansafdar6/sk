/**
 * EmptyState — placeholder for empty data views.
 */
import { InboxIcon } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = "No data found",
  description = "There's nothing here yet.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-(--bg-input) flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 theme-text-muted" />
      </div>
      <h3 className="text-lg font-semibold theme-text mb-1">
        {title}
      </h3>
      <p className="text-sm theme-text-muted max-w-sm mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
