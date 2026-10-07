import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = "@",
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}) {
  return (
    <div className="empty">
      <div style={{ fontSize: 30, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontWeight: 650, color: "var(--color-text)" }}>{title}</div>
      {description && <div className="text-sm">{description}</div>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ height = 16, width = "100%", radius }: { height?: number; width?: string | number; radius?: number }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="card card-pad stack">
      <Skeleton height={18} width="40%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={14} width={`${90 - i * 12}%`} />
      ))}
    </div>
  );
}
