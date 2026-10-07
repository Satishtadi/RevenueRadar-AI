import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { followUpsRepo } from "../../api/repository";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState, Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { isOverdue, isToday, relativeTime } from "../../utils/format";

type DueFilter = "today" | "overdue" | "upcoming" | "";

export function FollowUpsPage() {
  const [params, setParams] = useSearchParams();
  const due = (params.get("due") as DueFilter) ?? "";
  const toast = useToast();

  const query = useQuery({
    queryKey: ["followups", due],
    queryFn: () => followUpsRepo.list(due ? { due } : {}),
  });

  const rows = query.data?.content ?? [];
  const counts = {
    overdue: rows.filter((r) => r.status === "OVERDUE" || isOverdue(r.dueAt)).length,
    today: rows.filter((r) => isToday(r.dueAt)).length,
  };

  const setDue = (value: DueFilter) => {
    const next = new URLSearchParams(params);
    if (value) next.set("due", value);
    else next.delete("due");
    setParams(next, { replace: true });
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="page-subtitle">
            {counts.overdue} overdue · {counts.today} due today
          </p>
        </div>
        <Button variant="primary" onClick={() => toast.success("Follow-up created")}>
          + New follow-up
        </Button>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
        {(
          [
            ["", "All"],
            ["overdue", `Overdue (${counts.overdue})`],
            ["today", `Today (${counts.today})`],
            ["upcoming", "Upcoming"],
          ] as [DueFilter, string][]
        ).map(([value, label]) => (
          <button
            key={label}
            className={`btn btn-sm ${due === value ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setDue(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="card card-pad stack">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={44} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState title="No follow-ups here" description="Everything is up to date." icon="⏰" />
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Reason</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Priority</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => {
                const late = f.status === "OVERDUE" || isOverdue(f.dueAt);
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.customerName}</td>
                    <td className="muted text-sm">{(f.reason ?? "").replaceAll("_", " ").toLowerCase()}</td>
                    <td>{f.assignedUserName ?? "—"}</td>
                    <td style={{ color: late ? "var(--color-risk)" : undefined, fontWeight: late ? 650 : undefined }}>
                      {relativeTime(f.dueAt)}
                    </td>
                    <td>
                      <Badge value={f.priority} />
                    </td>
                    <td>
                      <Badge value={late ? "OVERDUE" : f.status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => toast.success(`Completed — ${f.customerName}`)}
                        >
                          ✓ Done
                        </button>
                        <Link className="btn btn-secondary btn-sm" to={`/app/leads/${f.leadId}`}>
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
