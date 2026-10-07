import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { leadsRepo } from "../../api/repository";
import { Badge, labelFor, toneFor } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, Skeleton } from "../../components/ui/States";
import { compactMoney, relativeTime, daysSince } from "../../utils/format";
import type { LeadStatus } from "../../api/types";

const STATUSES: (LeadStatus | "")[] = [
  "", "NEW", "CONTACTED", "QUALIFIED", "INTERESTED", "APPOINTMENT_BOOKED",
  "NEGOTIATION", "CONVERTED", "LOST", "RECOVERY",
];

export function LeadsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const page = Number(params.get("page") ?? 0);
  const status = params.get("status") ?? "";
  const assigned = params.get("assignedUserName") ?? "";

  const query = useQuery({
    queryKey: ["leads", { search, status, assigned, page }],
    queryFn: () => leadsRepo.list({ q: search, status, assignedUserName: assigned, page, size: 12 }),
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  };

  const rows = query.data?.content ?? [];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{query.data?.totalElements ?? 0} leads · sorted by most recent</p>
        </div>
        <Link to="/app/import">
          <Button variant="secondary">⇅ Import CSV</Button>
        </Link>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <div className="card-pad row" style={{ flexWrap: "wrap", gap: 10 }}>
          <input
            className="input"
            style={{ flex: "1 1 240px" }}
            placeholder="Search name or service…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setParam("q", e.target.value);
            }}
            aria-label="Search leads"
          />
          <select
            className="select"
            style={{ width: "auto" }}
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? labelFor(s) : "All statuses"}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: "auto" }}
            value={assigned}
            onChange={(e) => setParam("assignedUserName", e.target.value)}
            aria-label="Filter by owner"
          >
            <option value="">All owners</option>
            <option value="Rahul">Rahul</option>
            <option value="Priya">Priya</option>
            <option value="Anil">Anil</option>
          </select>
        </div>
      </div>

      {query.isLoading ? (
        <div className="card card-pad stack">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={44} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No leads match these filters"
            description="Try clearing filters, or import your existing leads."
            actionLabel="Import CSV"
            onAction={() => (window.location.href = "/app/import")}
            icon="⇉"
          />
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th>Score</th>
                <th className="table-numeric">Value</th>
                <th>Last contact</th>
                <th>Owner</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link to={`/app/leads/${lead.id}`} style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                      {lead.customerName}
                    </Link>
                    <div className="text-sm muted">{lead.source}</div>
                  </td>
                  <td>{lead.service ?? "—"}</td>
                  <td>
                    <Badge value={lead.status} />
                  </td>
                  <td>
                    {lead.recoveryScore && (
                      <span
                        className="badge"
                        style={{
                          background: scoreBg(lead.recoveryScore.score),
                          color: scoreFg(lead.recoveryScore.score),
                          borderColor: "transparent",
                        }}
                      >
                        {lead.recoveryScore.score}
                      </span>
                    )}
                  </td>
                  <td className="table-numeric" style={{ fontWeight: 600 }}>
                    {compactMoney(lead.estimatedValue ?? 0)}
                  </td>
                  <td style={{ color: daysSince(lead.lastContactAt) > 7 ? "var(--color-risk)" : undefined }}>
                    {relativeTime(lead.lastContactAt)}
                  </td>
                  <td>{lead.assignedUserName ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link className="btn btn-secondary btn-sm" to={`/app/leads/${lead.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="row-between" style={{ marginTop: "var(--space-4)" }}>
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setParam("page", String(page - 1))}>
            ← Previous
          </Button>
          <span className="text-sm muted">
            Page {page + 1} of {query.data?.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page + 1 >= (query.data?.totalPages ?? 1)}
            onClick={() => setParam("page", String(page + 1))}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}

function scoreBg(score: number) {
  if (score >= 80) return "var(--color-risk-soft)";
  if (score >= 60) return "var(--color-warning-soft)";
  return "var(--color-info-soft)";
}
function scoreFg(score: number) {
  if (score >= 80) return "var(--color-risk)";
  if (score >= 60) return "var(--color-warning)";
  return "var(--color-info)";
}

export { toneFor };
