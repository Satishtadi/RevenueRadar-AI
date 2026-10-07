import { useQuery } from "@tanstack/react-query";
import { appointmentsRepo } from "../../api/repository";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { formatDateTime } from "../../utils/format";

export function AppointmentsPage() {
  const toast = useToast();
  const query = useQuery({ queryKey: ["appointments"], queryFn: appointmentsRepo.list });
  const rows = query.data?.content ?? [];

  const missed = rows.filter((r) => r.status === "MISSED");

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">
            {missed.length} missed — each one automatically becomes a recovery opportunity
          </p>
        </div>
        <Button variant="primary" onClick={() => toast.success("Appointment created")}>
          + New appointment
        </Button>
      </div>

      {query.isLoading ? (
        <div className="card card-pad stack">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={44} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState title="No appointments yet" icon="▤" />
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} style={a.status === "MISSED" ? { background: "var(--color-risk-soft)" } : undefined}>
                  <td style={{ fontWeight: 600 }}>{a.customerName}</td>
                  <td>{a.service ?? "—"}</td>
                  <td>{formatDateTime(a.scheduledAt)}</td>
                  <td>
                    <Badge value={a.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {a.status === "MISSED" ? (
                      <Button variant="primary" size="sm" onClick={() => toast.success("Recovery task created")}>
                        Recover
                      </Button>
                    ) : (
                      <span className="text-sm muted">—</span>
                    )}
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
