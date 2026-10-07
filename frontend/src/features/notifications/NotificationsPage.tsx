import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

const ITEMS = [
  { id: 1, type: "HIGH_RECOVERY", title: "7 high-value recovery opportunities found", body: "₹84,000 potential revenue needs attention today.", time: "12m ago", read: false },
  { id: 2, type: "FOLLOWUP_OVERDUE", title: "11 follow-ups are overdue", body: "Oldest overdue follow-up is 4 days late.", time: "1h ago", read: false },
  { id: 3, type: "MISSED_APPOINTMENT", title: "Appointment missed — Rahul Sharma", body: "A recovery opportunity has been created automatically.", time: "3h ago", read: false },
  { id: 4, type: "FOLLOWUP_DUE", title: "29 follow-ups due today", body: "Your action plan is ready.", time: "5h ago", read: true },
  { id: 5, type: "AI_PLAN_READY", title: "Daily AI action plan generated", body: "5 customers require immediate attention.", time: "Yesterday", read: true },
];

export function NotificationsPage() {
  const toast = useToast();
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{ITEMS.filter((i) => !i.read).length} unread</p>
        </div>
        <Button variant="secondary" onClick={() => toast.success("All marked as read")}>
          Mark all read
        </Button>
      </div>

      <div className="stack">
        {ITEMS.map((n) => (
          <div
            key={n.id}
            className="card card-pad row-between"
            style={{ gap: 14, flexWrap: "wrap", background: n.read ? undefined : "var(--color-info-soft)" }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <Badge value={n.type} tone={n.read ? "neutral" : "info"} />
                <strong style={{ fontSize: "var(--text-base)" }}>{n.title}</strong>
              </div>
              <div className="text-sm muted" style={{ marginTop: 4 }}>
                {n.body}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="text-sm muted">{n.time}</div>
              {!n.read && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: "var(--color-primary)",
                    marginTop: 6,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="row" style={{ justifyContent: "center", marginTop: "var(--space-6)" }}>
        <Link to="/app/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
