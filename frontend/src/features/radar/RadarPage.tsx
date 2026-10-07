import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { recoveryRepo } from "../../api/repository";
import { Badge, labelFor } from "../../components/ui/Badge";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { EmptyState, Skeleton } from "../../components/ui/States";
import type { RadarCategory } from "../../api/types";
import { compactMoney, relativeTime } from "../../utils/format";

const CATEGORIES: (RadarCategory | "ALL")[] = [
  "ALL",
  "HIGH_PRIORITY",
  "FOLLOWUP_OVERDUE",
  "SILENT_CUSTOMER",
  "MISSED_APPOINTMENT",
  "HIGH_VALUE_CUSTOMER",
  "RECOVERY_OPPORTUNITY",
  "LOST_CUSTOMER",
];

export function RadarPage() {
  const [params, setParams] = useSearchParams();
  const active = (params.get("c") as RadarCategory | null) ?? "ALL";
  const [scoreMin, setScoreMin] = useState(0);

  const actions = useQuery({
    queryKey: ["recovery", "radar", active],
    queryFn: () => recoveryRepo.radar(active === "ALL" ? undefined : active),
  });

  const rows = (actions.data?.content ?? []).filter((a) => a.recoveryScore >= scoreMin);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue Radar</h1>
          <p className="page-subtitle">
            Every category below is a place your revenue is currently leaking.
          </p>
        </div>
        <div className="row">
          <label className="text-sm muted" htmlFor="score-min">
            Min score
          </label>
          <input
            id="score-min"
            type="range"
            min={0}
            max={100}
            step={5}
            value={scoreMin}
            onChange={(e) => setScoreMin(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <strong className="mono">{scoreMin}</strong>
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: "var(--space-5)" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`btn btn-sm ${active === c ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              const next = new URLSearchParams(params);
              if (c === "ALL") next.delete("c");
              else next.set("c", c);
              setParams(next, { replace: true });
            }}
          >
            {c === "ALL" ? "All" : labelFor(c)}
          </button>
        ))}
      </div>

      {actions.isLoading ? (
        <div className="stack">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card card-pad">
              <Skeleton height={16} width="45%" />
              <div style={{ height: 8 }} />
              <Skeleton height={12} width="70%" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No opportunities in this category"
            description="Radar runs continuously — new opportunities appear as leads go stale."
            icon="◉"
          />
        </div>
      ) : (
        <div className="stack">
          {rows.map((a) => (
            <Link
              key={a.id}
              to={`/app/leads/${a.leadId}`}
              className="card card-pad row-between"
              style={{ flexWrap: "wrap", gap: 16 }}
            >
              <div className="row" style={{ gap: 16, minWidth: 0, flex: 1 }}>
                <ScoreRing score={a.recoveryScore} size={64} />
                <div style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "var(--text-md)" }}>{a.customerName}</strong>
                    <Badge value={a.category} />
                    <Badge value={a.status} />
                  </div>
                  <div className="muted text-sm" style={{ marginTop: 3 }}>
                    {a.reason} → <strong style={{ color: "var(--color-primary)" }}>{a.recommendedAction}</strong>
                  </div>
                  <div className="muted text-sm">Opened {relativeTime(a.openedAt)}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="text-sm muted">Potential value</div>
                <strong style={{ color: "var(--color-warning)", fontSize: "var(--text-lg)" }}>
                  {compactMoney(a.potentialValue)}
                </strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
