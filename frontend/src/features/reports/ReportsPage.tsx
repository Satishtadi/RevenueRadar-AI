import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsRepo } from "../../api/repository";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/States";
import { compactMoney } from "../../utils/format";

const TABS = [
  { id: "leads", label: "Lead Report" },
  { id: "conversion", label: "Conversion" },
  { id: "revenue", label: "Revenue" },
  { id: "recovery", label: "Recovery" },
  { id: "team", label: "Employee Performance" },
  { id: "lost", label: "Lost Customers" },
  { id: "followups", label: "Follow-up Performance" },
] as const;

export function ReportsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("recovery");
  const team = useQuery({ queryKey: ["reports", "team"], queryFn: reportsRepo.teamPerformance });
  const lost = useQuery({ queryKey: ["reports", "lost"], queryFn: reportsRepo.lostReasons });

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Operational analytics — not a performance ranking tool.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select className="select" style={{ width: "auto" }} defaultValue="30d" aria-label="Period">
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom</option>
          </select>
          <Button variant="secondary">⤓ Export CSV</Button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "var(--space-5)" }}>
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? "tab-active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" && (
        <div className="card table-wrap">
          {team.isLoading ? (
            <div className="card-pad stack">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={36} />
              ))}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="table-numeric">Assigned</th>
                  <th className="table-numeric">Contacted</th>
                  <th className="table-numeric">Follow-ups</th>
                  <th className="table-numeric">Converted</th>
                  <th className="table-numeric">Lost</th>
                  <th className="table-numeric">Recovery</th>
                  <th className="table-numeric">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(team.data ?? []).map((m) => (
                  <tr key={m.userId}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td className="table-numeric">{m.assignedLeads}</td>
                    <td className="table-numeric">{m.contacted}</td>
                    <td className="table-numeric">{m.followUps}</td>
                    <td className="table-numeric" style={{ color: "var(--color-success)", fontWeight: 650 }}>
                      {m.conversions}
                    </td>
                    <td className="table-numeric" style={{ color: "var(--color-risk)" }}>
                      {m.lost}
                    </td>
                    <td className="table-numeric">{m.recoveryActions}</td>
                    <td className="table-numeric" style={{ fontWeight: 650 }}>
                      {compactMoney(m.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "lost" && (
        <div className="grid grid-3">
          {(lost.data ?? []).map((r) => (
            <div key={r.label} className="card card-pad">
              <div className="text-sm muted">{r.label}</div>
              <div style={{ fontSize: "var(--text-2xl)", fontWeight: 750, color: "var(--color-risk)", marginTop: 4 }}>
                {r.value}%
              </div>
              <div className="text-sm muted" style={{ marginTop: 4 }}>
                {compactMoney(r.amount ?? 0)} lost
              </div>
            </div>
          ))}
        </div>
      )}

      {(tab === "recovery" || tab === "revenue" || tab === "leads" || tab === "conversion" || tab === "followups") && (
        <div className="grid grid-4">
          {[
            { label: "Opportunities opened", value: "186", tone: "var(--color-info)" },
            { label: "Resolved", value: "74", tone: "var(--color-success)" },
            { label: "Recovery rate", value: "39%", tone: "var(--color-warning)" },
            { label: "Revenue recovered", value: compactMoney(48000), tone: "var(--color-success)" },
            { label: "Leads created", value: "312", tone: "var(--color-info)" },
            { label: "Conversion rate", value: "18.4%", tone: "var(--color-info)" },
            { label: "Avg sales cycle", value: "9 days", tone: "var(--color-text-secondary)" },
            { label: "Avg follow-up delay", value: "31h", tone: "var(--color-risk)" },
          ].map((k) => (
            <div key={k.label} className="card card-pad">
              <div className="text-sm muted" style={{ fontWeight: 550 }}>
                {k.label}
              </div>
              <div style={{ fontSize: "var(--text-xl)", fontWeight: 750, color: k.tone, marginTop: 4 }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
