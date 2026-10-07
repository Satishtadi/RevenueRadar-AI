import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { customersRepo } from "../../api/repository";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, Skeleton } from "../../components/ui/States";
import { compactMoney, initials, relativeTime } from "../../utils/format";

export function CustomersPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const page = Number(params.get("page") ?? 0);

  const query = useQuery({
    queryKey: ["customers", { search, page }],
    queryFn: () => customersRepo.list({ q: search, page, size: 12 }),
  });

  const rows = query.data?.content ?? [];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{query.data?.totalElements ?? 0} customers</p>
        </div>
        <Link to="/app/import">
          <Button variant="secondary">⇅ Import</Button>
        </Link>
      </div>

      <div className="card card-pad" style={{ marginBottom: "var(--space-4)" }}>
        <input
          className="input"
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            const next = new URLSearchParams(params);
            if (e.target.value) next.set("q", e.target.value);
            else next.delete("q");
            next.delete("page");
            setParams(next, { replace: true });
          }}
          aria-label="Search customers"
        />
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
            title="No customers found"
            description="Import your existing customer list to get started."
            actionLabel="Import CSV"
            onAction={() => (window.location.href = "/app/import")}
            icon="☺"
          />
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Source</th>
                <th className="table-numeric">Revenue</th>
                <th>Last interaction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <span
                        className="avatar"
                        style={{ width: 30, height: 30, fontSize: 12, background: "var(--color-neutral-border)", color: "var(--color-text-secondary)" }}
                      >
                        {initials(c.name)}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        {c.tags.length > 0 && (
                          <div className="row" style={{ gap: 4, marginTop: 2 }}>
                            {c.tags.map((t) => (
                              <span key={t} className="badge badge-warning">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">
                    <div>{c.phone}</div>
                    <div className="muted">{c.email}</div>
                  </td>
                  <td>{c.location ?? "—"}</td>
                  <td>
                    <Badge value={c.source ?? "UNKNOWN"} tone="neutral" />
                  </td>
                  <td className="table-numeric" style={{ fontWeight: 600 }}>
                    {compactMoney(c.totalRevenue)}
                  </td>
                  <td style={{ color: relativeTime(c.lastInteractionAt) === "Never" ? "var(--color-risk)" : undefined }}>
                    {relativeTime(c.lastInteractionAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
