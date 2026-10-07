import { useQuery } from "@tanstack/react-query";
import { reportsRepo } from "../../api/repository";
import { Skeleton } from "../../components/ui/States";
import { compactMoney } from "../../utils/format";

export function TeamPage() {
  const query = useQuery({ queryKey: ["reports", "team"], queryFn: reportsRepo.teamPerformance });
  const rows = query.data ?? [];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team performance</h1>
          <p className="page-subtitle">
            Operational view of follow-up and recovery activity — use it to coach, not to punish.
          </p>
        </div>
      </div>

      <div className="card table-wrap">
        {query.isLoading ? (
          <div className="card-pad stack">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={40} />
            ))}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="table-numeric">Assigned</th>
                <th className="table-numeric">Follow-ups</th>
                <th className="table-numeric">Converted</th>
                <th className="table-numeric">Lost</th>
                <th className="table-numeric">Recovery actions</th>
                <th className="table-numeric">Revenue</th>
                <th className="table-numeric">Follow-up rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const rate = Math.round((m.followUps / Math.max(1, m.assignedLeads)) * 100);
                return (
                  <tr key={m.userId}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <span className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                          {m.name.slice(0, 1)}
                        </span>
                        <strong>{m.name}</strong>
                      </div>
                    </td>
                    <td className="table-numeric">{m.assignedLeads}</td>
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
                    <td className="table-numeric">
                      <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
                        <div style={{ width: 60, height: 6, background: "#eef0f3", borderRadius: 99 }}>
                          <div
                            style={{
                              width: `${rate}%`,
                              height: "100%",
                              borderRadius: 99,
                              background: rate > 60 ? "var(--color-success)" : rate > 40 ? "var(--color-warning)" : "var(--color-risk)",
                            }}
                          />
                        </div>
                        <span className="mono" style={{ width: 34, textAlign: "right" }}>
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
