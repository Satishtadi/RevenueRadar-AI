import type { ReactNode } from "react";
import { compactMoney } from "../../utils/format";

type Tone = "risk" | "warning" | "success" | "info" | "neutral";

const COLORS: Record<Tone, string> = {
  risk: "var(--color-risk)",
  warning: "var(--color-warning)",
  success: "var(--color-success)",
  info: "var(--color-info)",
  neutral: "var(--color-text-secondary)",
};

interface Props {
  label: string;
  value: number;
  tone: Tone;
  currency?: boolean;
  hint?: string;
  action?: ReactNode;
}

export function StatCard({ label, value, tone, currency, hint, action }: Props) {
  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="row-between">
        <span className="text-sm muted" style={{ fontWeight: 550 }}>
          {label}
        </span>
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 99, background: COLORS[tone], display: "inline-block" }}
        />
      </div>
      <div
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: 750,
          letterSpacing: "-0.03em",
          color: COLORS[tone],
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {currency ? compactMoney(value) : value.toLocaleString("en-IN")}
      </div>
      {(hint || action) && (
        <div className="row-between text-sm muted">
          <span>{hint}</span>
          {action}
        </div>
      )}
    </div>
  );
}
