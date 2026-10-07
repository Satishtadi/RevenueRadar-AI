import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiRepo, dashboardRepo, recoveryRepo } from "../../api/repository";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { compactMoney, initials } from "../../utils/format";
import type { ActionPlanItem, GeneratedMessage } from "../../api/types";

export function ActionPlanPage() {
  const navigate = useNavigate();
  const plan = useQuery({ queryKey: ["dashboard", "plan"], queryFn: dashboardRepo.actionPlan });
  const actions = useQuery({ queryKey: ["recovery", "radar"], queryFn: () => recoveryRepo.radar() });
  const toast = useToast();

  if (plan.isLoading) {
    return (
      <div className="page stack">
        <Skeleton height={28} width="40%" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card card-pad">
            <Skeleton height={18} width="55%" />
            <div style={{ height: 8 }} />
            <Skeleton height={12} width="80%" />
          </div>
        ))}
      </div>
    );
  }

  const items = plan.data ?? [];
  const totalValue = items.reduce((sum, i) => sum + i.potentialValue, 0);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Today's AI Action Plan</h1>
          <p className="page-subtitle">
            {items.length} important actions · {compactMoney(totalValue)} potential value at stake
          </p>
        </div>
        <div className="row">
          <Button variant="secondary" onClick={() => toast.success("Plan refreshed")}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="lg"
            disabled={items.length === 0}
            onClick={() => navigate(`/app/recovery/session/1`)}
          >
            ▶ Start Recovery Session
          </Button>
        </div>
      </div>

      <div className="stack">
        {items.map((item, i) => (
          <ActionPlanRow key={item.id} item={item} index={i} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="card card-pad empty">
          <div style={{ fontSize: 30 }}>✓</div>
          <div style={{ fontWeight: 650 }}>Nothing urgent today</div>
          <div className="text-sm">No overdue follow-ups or high-priority opportunities right now.</div>
          <Link to="/app/leads">
            <Button variant="secondary">Browse leads</Button>
          </Link>
        </div>
      )}

      <div className="card card-pad" style={{ marginTop: "var(--space-5)" }}>
        <div className="row-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 650 }}>How this list is built</div>
            <p className="muted text-sm" style={{ marginTop: 2 }}>
              Ranked deterministically by recovery score × potential value — no AI call is spent to build this queue.
            </p>
          </div>
          <Link to="/app/radar">
            <Button variant="secondary">Open Revenue Radar</Button>
          </Link>
        </div>
        <div className="row" style={{ marginTop: 14, flexWrap: "wrap", gap: 8 }}>
          <span className="text-sm muted">Open opportunities:</span>
          {(actions.data?.content ?? []).slice(0, 8).map((a) => (
            <Link key={a.id} to={`/app/leads/${a.leadId}`}>
              <span className="badge badge-neutral" title={a.reason}>
                {a.customerName.split(" ")[0]} · {a.recoveryScore}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionPlanRow({ item, index }: { item: ActionPlanItem; index: number }) {
  const navigate = useNavigate();
  return (
    <div
      className="card card-pad row-between"
      style={{ flexWrap: "wrap", gap: 16, borderLeft: `4px solid ${index < 3 ? "var(--color-risk)" : "var(--color-warning)"}` }}
    >
      <div className="row" style={{ gap: 16, minWidth: 0, flex: 1 }}>
        <ScoreRing score={item.recoveryScore} size={68} />
        <div style={{ minWidth: 0 }}>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontSize: "var(--text-md)" }}>{index + 1}. {item.customerName}</strong>
            <Badge value={item.type} />
          </div>
          <div className="muted text-sm" style={{ marginTop: 3 }}>
            {item.reason}
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 18 }}>
        <div style={{ textAlign: "right" }}>
          <div className="text-sm muted">Potential value</div>
          <strong style={{ color: "var(--color-warning)", fontSize: "var(--text-lg)" }}>
            {compactMoney(item.potentialValue)}
          </strong>
        </div>
        <Button variant="primary" onClick={() => navigate(`/app/recovery/session/1`)}>
          Recover
        </Button>
      </div>
    </div>
  );
}

export function RecoverySessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const plan = useQuery({ queryKey: ["dashboard", "plan"], queryFn: dashboardRepo.actionPlan });
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<GeneratedMessage | null>(null);
  const [language, setLanguage] = useState<"EN" | "TE">("EN");

  const items = plan.data ?? [];
  const current = items[index];

  const generate = useMutation({
    mutationFn: () =>
      aiRepo.generateMessage({
        leadId: current!.leadId,
        channel: "WHATSAPP",
        language,
      }),
    onSuccess: (msg) => {
      setMessage(msg);
      setDraft(msg.content);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not generate message"),
  });

  const total = items.length;
  const covered = useMemo(() => done.reduce((s, id) => s + (items.find((i) => i.id === id)?.potentialValue ?? 0), 0), [done, items]);

  if (plan.isLoading) {
    return (
      <div className="page">
        <Skeleton height={220} />
      </div>
    );
  }

  if (total === 0 || done.length + skipped >= total) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <div className="card card-pad" style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <div style={{ fontSize: 44 }}>✓</div>
          <h1 className="page-title" style={{ marginTop: 8 }}>
            Session complete
          </h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {done.length} of {total} customers contacted · {skipped} skipped
          </p>
          <div
            style={{
              fontSize: "var(--text-3xl)",
              fontWeight: 800,
              color: "var(--color-success)",
              marginTop: 16,
              letterSpacing: "-0.03em",
            }}
          >
            {compactMoney(covered)}
          </div>
          <div className="muted text-sm">potential value covered today</div>
          <div className="row" style={{ justifyContent: "center", marginTop: 24 }}>
            <Button variant="secondary" onClick={() => navigate("/app/action-plan")}>
              Back to plan
            </Button>
            <Button variant="primary" onClick={() => navigate("/app/dashboard")}>
              Go to dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const lead = current!;
  const advance = () => {
    setMessage(null);
    setDraft("");
    setIndex((i) => Math.min(i + 1, total - 1));
  };

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <div className="row-between" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <div className="text-sm muted">
            Recovery session {sessionId} · {index + 1} of {total}
          </div>
          <div
            style={{
              height: 6,
              background: "var(--color-border)",
              borderRadius: 99,
              marginTop: 8,
              width: "min(420px, 60vw)",
            }}
          >
            <div
              style={{
                height: "100%",
              width: `${(index / Math.max(1, total - 1)) * 100}%`,
                background: "var(--color-primary)",
                borderRadius: 99,
                transition: "width var(--dur) var(--ease)",
              }}
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/action-plan")}>
          End session
        </Button>
      </div>

      <div className="card card-pad fade-in" key={lead.id}>
        <div className="row" style={{ gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 99,
              background: "linear-gradient(135deg,#2563eb,#7c3aed)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {initials(lead.customerName)}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 750 }}>{lead.customerName}</h1>
            <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              <Badge value={lead.type} />
              <span className="badge badge-neutral">{compactMoney(lead.potentialValue)} potential</span>
            </div>
          </div>
          <ScoreRing score={lead.recoveryScore} size={96} />
        </div>

        <div style={{ marginTop: "var(--space-5)", padding: "var(--space-4)", background: "var(--color-risk-soft)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-risk-border)" }}>
          <div style={{ fontWeight: 700, color: "var(--color-risk)", fontSize: "var(--text-sm)" }}>WHY THIS CUSTOMER</div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--color-text-secondary)", fontSize: "var(--text-base)" }}>
            <li>{lead.reason}</li>
            <li>Recovery score {lead.recoveryScore}/100</li>
            <li>Potential value {compactMoney(lead.potentialValue)}</li>
          </ul>
        </div>

        <div style={{ marginTop: "var(--space-5)" }}>
          <div className="row-between" style={{ marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 650 }}>AI recommendation: send follow-up message</div>
            <div className="row" style={{ gap: 6 }}>
              <button
                className={`btn btn-sm ${language === "EN" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setLanguage("EN")}
              >
                English
              </button>
              <button
                className={`btn btn-sm ${language === "TE" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setLanguage("TE")}
              >
                తెలుగు
              </button>
            </div>
          </div>

          {!message ? (
            <Button variant="primary" size="lg" block disabled={generate.isPending} onClick={() => generate.mutate()}>
              {generate.isPending ? "Generating…" : "✦ Generate message"}
            </Button>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              <textarea
                className="textarea"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Message draft"
                style={{ minHeight: 120 }}
              />
              <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => setDraft(draft)} disabled>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={generate.isPending}
                  onClick={() => generate.mutate()}
                >
                  {generate.isPending ? "…" : "Regenerate"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(draft);
                    toast.success("Message copied — paste it into WhatsApp");
                  }}
                >
                  ⧉ Copy
                </Button>
                <span className="badge badge-warning" title="Sending arrives in Phase 2 — copy and paste for now">
                  Manual send
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="row" style={{ marginTop: "var(--space-6)", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant="success"
            size="lg"
            onClick={() => {
              setDone((d) => [...d, lead.id]);
              toast.success(`Marked ${lead.customerName.split(" ")[0]} as contacted`);
              setMessage(null);
              setDraft("");
              queryClient.invalidateQueries({ queryKey: ["followups"] });
            }}
          >
            ✓ Mark Contacted
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setSkipped((s) => s + 1);
              setMessage(null);
              setDraft("");
              advance();
            }}
          >
            Skip
          </Button>
          <Link to={`/app/leads/${lead.leadId}`} style={{ marginLeft: "auto" }}>
            <Button variant="ghost">Open full lead →</Button>
          </Link>
        </div>
      </div>

      <p className="muted text-sm" style={{ marginTop: "var(--space-4)", textAlign: "center" }}>
        Nothing is sent automatically. You review and approve every message.
      </p>
    </div>
  );
}
