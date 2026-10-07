import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardRepo, revenueRepo, followUpsRepo, isDemoData } from "../../api/repository";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { Skeleton } from "../../components/ui/States";
import { Button } from "../../components/ui/Button";
import { compactMoney, formatDate, isOverdue, relativeTime } from "../../utils/format";
import { labelFor } from "../../components/ui/Badge";

export function DashboardPage() {
  const navigate = useNavigate();
  const revenue = useQuery({ queryKey: ["revenue", "summary"], queryFn: revenueRepo.summary });
  const pulse = useQuery({ queryKey: ["dashboard", "pulse"], queryFn: dashboardRepo.pulse });
  const radar = useQuery({ queryKey: ["dashboard", "radar"], queryFn: dashboardRepo.radarSummary });
  const plan = useQuery({ queryKey: ["dashboard", "plan"], queryFn: dashboardRepo.actionPlan });
  const due = useQuery({
    queryKey: ["followups", "today"],
    queryFn: () => followUpsRepo.list({ due: "today" }),
  });

  if (revenue.isLoading || pulse.isLoading) {
    return (
      <div className="page">
        <div className="grid grid-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card card-pad">
              <Skeleton height={14} width="50%" />
              <div style={{ height: 10 }} />
              <Skeleton height={30} width="70%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const r = revenue.data!;
  const p = pulse.data!;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue overview</h1>
          <p className="page-subtitle">Where your revenue is leaking — and what to do next.</p>
        </div>
        <Button variant="primary" onClick={() => navigate("/app/action-plan")}>
          Start Recovery Session →
        </Button>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-4">
        <StatCard label="Revenue at Risk" value={r.atRisk} tone="risk" currency hint="Unresolved opportunities" />
        <StatCard label="Potential Recoverable" value={r.potential} tone="warning" currency hint="High recovery probability" />
        <StatCard
          label={r.recoveredVerified ? "Recovered Revenue" : "Estimated Recovery"}
          value={r.recovered}
          tone="success"
          currency
          hint={r.recoveredVerified ? "Verified from actual records" : "Not yet verified"}
        />
        <StatCard label="Recovery ROI" value={r.roiMultiple} tone="info" hint="vs subscription cost" />
      </div>

      {/* Pulse row */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(5, minmax(0,1fr))", marginTop: "var(--space-4)" }} id="pulse-row">
        {[
          { label: "High Priority", value: p.highPriority, to: "/app/radar?c=HIGH_PRIORITY", tone: "risk" },
          { label: "Due Today", value: p.dueToday, to: "/app/followups?due=today", tone: "warning" },
          { label: "Overdue", value: p.overdue, to: "/app/followups?due=overdue", tone: "risk" },
          { label: "Silent Customers", value: p.silentCustomers, to: "/app/radar?c=SILENT_CUSTOMER", tone: "warning" },
          { label: "Missed Appts", value: p.missedAppointments, to: "/app/radar?c=MISSED_APPOINTMENT", tone: "info" },
        ].map((x) => (
          <Link key={x.label} to={x.to} className="card card-pad" style={{ display: "block" }}>
            <div className="text-sm muted" style={{ fontWeight: 550 }}>
              {x.label}
            </div>
            <div
              style={{
                fontSize: "var(--text-xl)",
                fontWeight: 750,
                marginTop: 4,
                color: x.tone === "risk" ? "var(--color-risk)" : x.tone === "warning" ? "var(--color-warning)" : "var(--color-info)",
              }}
            >
              {x.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: "var(--space-4)", alignItems: "start" }}>
        {/* Action plan */}
        <section className="card">
          <div className="card-header">
            <span className="card-title">Today's AI Action Plan</span>
            <Link to="/app/action-plan" className="text-sm" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              View all
            </Link>
          </div>
          <div className="card-pad stack" style={{ gap: "var(--space-3)" }}>
            <p className="text-sm muted">
              You have <strong>{plan.data?.length ?? 0}</strong> important actions today.
            </p>
            {(plan.data ?? []).slice(0, 5).map((item, i) => (
              <div
                key={item.id}
                className="row-between"
                style={{ padding: "10px 12px", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)" }}
              >
                <div className="row" style={{ gap: 12, minWidth: 0 }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 99,
                      background: i < 3 ? "var(--color-risk)" : "var(--color-warning)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>{item.customerName}</div>
                    <div className="text-sm muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {labelFor(item.type)} · {item.reason}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--color-risk)" }}>{compactMoney(item.potentialValue)}</div>
                  <div className="text-sm muted">score {item.recoveryScore}</div>
                </div>
              </div>
            ))}
            <Button variant="primary" block onClick={() => navigate("/app/action-plan")}>
              Start Recovery Session
            </Button>
          </div>
        </section>

        {/* Radar categories */}
        <section className="card">
          <div className="card-header">
            <span className="card-title">Revenue Radar</span>
            <Link to="/app/radar" className="text-sm" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              Open radar
            </Link>
          </div>
          <div className="card-pad stack" style={{ gap: "var(--space-2)" }}>
            {(radar.data?.categories ?? []).map((c) => (
              <Link
                key={c.category}
                to={`/app/radar?c=${c.category}`}
                className="row-between"
                style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
              >
                <div className="row" style={{ gap: 10 }}>
                  <Badge value={c.category} />
                </div>
                <div className="row" style={{ gap: 14 }}>
                  <strong>{c.count}</strong>
                  <span className="text-sm muted" style={{ minWidth: 62, textAlign: "right" }}>
                    {compactMoney(c.potentialValue)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Follow-ups due */}
      <section className="card" style={{ marginTop: "var(--space-4)" }}>
        <div className="card-header">
          <span className="card-title">Follow-ups due today</span>
          <Link to="/app/followups" className="text-sm" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            All follow-ups
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Reason</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(due.data?.content ?? []).slice(0, 6).map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.customerName}</td>
                  <td className="muted">{(f.reason ?? "").replaceAll("_", " ").toLowerCase()}</td>
                  <td>{f.assignedUserName ?? "—"}</td>
                  <td style={{ color: isOverdue(f.dueAt) ? "var(--color-risk)" : undefined }}>
                    {relativeTime(f.dueAt)}
                  </td>
                  <td>
                    <Badge value={f.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link className="btn btn-secondary btn-sm" to={`/app/leads/${f.leadId}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {(due.data?.content ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: "center", padding: 24 }}>
                    No follow-ups due today. {isDemoData.value ? "" : "Nice work."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leakage insight */}
      <section className="card card-pad" style={{ marginTop: "var(--space-4)", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <ScoreRing score={82} size={90} label="Follow-up health" />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="badge badge-risk">Biggest revenue leak</div>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 8 }}>
            Delayed follow-up is costing you the most.
          </h3>
          <p className="muted text-sm" style={{ marginTop: 4 }}>
            31% of lost leads were not contacted within 48 hours. Reduce first-follow-up time to under 24 hours to
            protect an estimated {compactMoney(96000)} this month.
          </p>
        </div>
        <Link to="/app/leakage">
          <Button variant="secondary">See leakage analysis</Button>
        </Link>
      </section>

      <p className="muted text-sm" style={{ marginTop: "var(--space-5)" }}>
        Last updated {formatDate(new Date().toISOString())} · figures shown as potential until verified.
      </p>
    </div>
  );
}
