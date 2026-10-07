import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="Close"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          padding: 0,
          background: "rgba(15,23,42,0.5)",
          cursor: "pointer",
        }}
      />
      <div
        className="card fade-in"
        style={{ width: "100%", maxWidth: width, position: "relative", maxHeight: "88vh", overflow: "auto" }}
      >
        <div className="card-header">
          <span className="card-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="card-pad">{children}</div>
        {footer && (
          <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
