import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { reportsRepo } from "../../api/repository";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/States";
import { compactMoney } from "../../utils/format";

const COLORS = ["#dc2626", "#ea580c", "#f59e0b", "#2563eb", "#7c3aed", "#6b7280"];

export function LeakagePage() {
  const query = useQuery({ queryKey: ["reports", "lost"], queryFn: reportsRepo.lostReasons });
  const rows = query.data ?? [];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue Leakage Analysis</h1>
          <p className="page-subtitle">Why customers are being lost — and how much each reason costs.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select className="select" style={{ width: "auto" }} defaultValue="30d" aria-label="Date range">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>
          <Button variant="secondary">⤓ Export</Button>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card card-pad">
          <div className="card-title" style={{ marginBottom: 18 }}>
            Lost reason distribution
          </div>
          {query.isLoading ? (
            <Skeleton height={220} />
          ) : (
            <div className="stack" style={{ gap: 14 }}>
              {rows.map((r, i) => (
                <div key={r.label}>
                  <div className="row-between text-sm" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 550 }}>{r.label}</span>
                    <span className="mono">{r.value}%</span>
                  </div>
                  <div style={{ height: 9, background: "#eef0f3", borderRadius: 99 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${r.value}%`,
                        background: COLORS[i % COLORS.length],
                        borderRadius: 99,
                        transition: "width 600ms var(--ease)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card card-pad" style={{ borderLeft: "4px solid var(--color-risk)" }}>
            <div className="badge badge-risk">Biggest leak</div>
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 10 }}>
              Delayed follow-up accounts for 31% of all lost revenue.
            </h3>
            <p className="muted text-sm" style={{ marginTop: 6 }}>
              {compactMoney(96000)} walked away because nobody responded in time. Cutting first-response time to
              under 24 hours is the single highest-impact fix available to you.
            </p>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Value lost by reason</span>
            </div>
            <div className="card-pad stack" style={{ gap: 10 }}>
              {query.isLoading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={30} />)
                : rows.map((r) => (
                    <div key={r.label} className="row-between">
                      <span className="text-sm">{r.label}</span>
                      <strong style={{ color: "var(--color-risk)" }}>{compactMoney(r.amount ?? 0)}</strong>
                    </div>
                  ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 8 }}>
              Filters
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              <select className="select" style={{ width: "auto" }} defaultValue="" aria-label="Employee">
                <option value="">All employees</option>
                <option>Rahul</option>
                <option>Priya</option>
                <option>Anil</option>
              </select>
              <select className="select" style={{ width: "auto" }} defaultValue="" aria-label="Service">
                <option value="">All services</option>
                <option>Dental Implant</option>
                <option>Root Canal</option>
                <option>Braces Consultation</option>
              </select>
              <select className="select" style={{ width: "auto" }} defaultValue="" aria-label="Source">
                <option value="">All sources</option>
                <option>WhatsApp</option>
                <option>Google</option>
                <option>Referral</option>
              </select>
            </div>
          </div>

          <Link to="/app/reports">
            <Button variant="secondary" block>
              Open full reports →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
