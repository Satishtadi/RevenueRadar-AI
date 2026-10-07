import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { aiRepo, leadsRepo } from "../../api/repository";
import { Badge, labelFor } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { compactMoney, formatDate, relativeTime } from "../../utils/format";
import type { GeneratedMessage } from "../../api/types";

const TIMELINE = [
  { date: "Jun 10", text: "Customer enquiry received", tone: "info" },
  { date: "Jun 10", text: "Sales employee responded", tone: "neutral" },
  { date: "Jun 11", text: "Customer asked price", tone: "warning" },
  { date: "Jun 12", text: "AI recommended follow-up", tone: "info" },
  { date: "Jun 15", text: "No follow-up completed", tone: "risk" },
  { date: "Jun 16", text: "Customer marked as high recovery opportunity", tone: "risk" },
];

export function LeadDetailPage() {
  const { leadId } = useParams();
  const toast = useToast();
  const lead = useQuery({ queryKey: ["lead", leadId], queryFn: () => leadsRepo.get(leadId!) });
  const score = useQuery({ queryKey: ["lead-score", leadId], queryFn: () => leadsRepo.score(leadId!) });

  const [language, setLanguage] = useState<"EN" | "TE">("EN");
  const [message, setMessage] = useState<GeneratedMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<"overview" | "timeline" | "ai">("overview");

  const generate = useMutation({
    mutationFn: () => aiRepo.generateMessage({ leadId: leadId!, channel: "WHATSAPP", language }),
    onSuccess: (m) => {
      setMessage(m);
      setDraft(m.content);
      toast.success("Draft ready — review before using it");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  if (lead.isLoading) {
    return (
      <div className="page stack">
        <Skeleton height={30} width="35%" />
        <div className="grid grid-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card card-pad">
              <Skeleton height={16} width="50%" />
              <div style={{ height: 10 }} />
              <Skeleton height={26} width="70%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const l = lead.data!;
  const s = score.data;

  return (
    <div className="page fade-in">
      <div className="row-between" style={{ marginBottom: "var(--space-5)", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Link to="/app/leads" className="text-sm muted">
            ← Leads
          </Link>
          <h1 className="page-title" style={{ marginTop: 4 }}>
            {l.customerName}
          </h1>
          <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <Badge value={l.status} />
            <Badge value={l.priority} />
            <span className="badge badge-neutral">{l.service ?? "No service"}</span>
            <span className="badge badge-neutral">{l.source ?? "Unknown source"}</span>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Button variant="secondary" onClick={() => toast.success("Follow-up scheduled for tomorrow 10:00")}>
            ⏰ Schedule follow-up
          </Button>
          <Link to={`/app/recovery/session/1`}>
            <Button variant="primary">Recover this lead</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ alignItems: "start" }}>
        {/* Score card */}
        <div className="card card-pad">
          <div className="card-title" style={{ marginBottom: 14 }}>
            Recovery Score
          </div>
          <div className="row" style={{ gap: 18 }}>
            <ScoreRing score={s?.score ?? 0} size={100} />
            <div className="stack" style={{ gap: 6, flex: 1 }}>
              {s &&
                (
                  [
                    ["Intent", s.intentScore, 25],
                    ["Engagement", s.engagementScore, 20],
                    ["Value", s.valueScore, 15],
                    ["Recency", s.recencyScore, 15],
                    ["Follow-up risk", s.followupRiskScore, 15],
                    ["Appointment", s.appointmentSignalScore, 10],
                  ] as [string, number, number][]
                ).map(([label, val, max]) => (
                  <div key={label}>
                    <div className="row-between text-sm">
                      <span className="muted">{label}</span>
                      <span className="mono">
                        {val}/{max}
                      </span>
                    </div>
                    <div style={{ height: 5, background: "#eef0f3", borderRadius: 99, marginTop: 3 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(val / max) * 100}%`,
                          background: "var(--color-primary)",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {s && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
              <div className="text-sm muted" style={{ fontWeight: 600, marginBottom: 6 }}>
                WHY THIS SCORE
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {s.factors.map((f, i) => (
                  <li key={i} style={{ marginBottom: 3 }}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Middle column */}
        <div className="card">
          <div className="card-header" style={{ padding: 0, borderBottom: "none" }}>
            <div className="tabs" style={{ width: "100%", borderBottom: "none" }}>
              {(["overview", "timeline", "ai"] as const).map((t) => (
                <button
                  key={t}
                  className={`tab ${tab === t ? "tab-active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "overview" ? "Overview" : t === "timeline" ? "Timeline" : "AI Assistant"}
                </button>
              ))}
            </div>
          </div>
          <div className="card-pad" style={{ borderTop: "1px solid var(--color-border)" }}>
            {tab === "overview" && <OverviewTab lead={l} />}
            {tab === "timeline" && <TimelineTab />}
            {tab === "ai" && (
              <div className="stack">
                <div className="row-between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div className="text-sm muted">Generate a WhatsApp-style follow-up in:</div>
                  <div className="row" style={{ gap: 6 }}>
                    <button className={`btn btn-sm ${language === "EN" ? "btn-primary" : "btn-secondary"}`} onClick={() => setLanguage("EN")}>
                      English
                    </button>
                    <button className={`btn btn-sm ${language === "TE" ? "btn-primary" : "btn-secondary"}`} onClick={() => setLanguage("TE")}>
                      తెలుగు
                    </button>
                  </div>
                </div>

                {!message ? (
                  <Button variant="primary" block size="lg" disabled={generate.isPending} onClick={() => generate.mutate()}>
                    {generate.isPending ? "Generating…" : "✦ Generate follow-up message"}
                  </Button>
                ) : (
                  <>
                    <textarea
                      className="textarea"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      style={{ minHeight: 130 }}
                      aria-label="Generated message"
                    />
                    <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                      <Button variant="secondary" size="sm" disabled={generate.isPending} onClick={() => generate.mutate()}>
                        {generate.isPending ? "…" : "⟳ Regenerate"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(draft);
                          toast.success("Copied — paste into WhatsApp");
                        }}
                      >
                        ⧉ Copy
                      </Button>
                      <Button variant="success" size="sm" onClick={() => toast.success("Approved. Sending arrives in Phase 2 — copied for you.")}>
                        ✓ Approve
                      </Button>
                      <span className="badge badge-warning">Human review required</span>
                    </div>
                  </>
                )}

                <div
                  className="text-sm muted"
                  style={{ padding: "10px 12px", background: "var(--color-neutral-soft)", borderRadius: "var(--radius-md)" }}
                >
                  Messages are never sent automatically. You edit, approve, and send.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="stack">
          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 12 }}>
              Opportunity
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <div className="row-between">
                <span className="muted text-sm">Estimated value</span>
                <strong>{compactMoney(l.estimatedValue ?? 0)}</strong>
              </div>
              <div className="row-between">
                <span className="muted text-sm">Actual value</span>
                <strong>{l.actualValue ? compactMoney(l.actualValue) : "—"}</strong>
              </div>
              <div className="row-between">
                <span className="muted text-sm">Owner</span>
                <strong>{l.assignedUserName ?? "Unassigned"}</strong>
              </div>
              <div className="row-between">
                <span className="muted text-sm">Last contact</span>
                <strong>{relativeTime(l.lastContactAt)}</strong>
              </div>
              <div className="row-between">
                <span className="muted text-sm">Next follow-up</span>
                <strong>{l.nextFollowUpAt ? formatDate(l.nextFollowUpAt) : "Not set"}</strong>
              </div>
              <div className="row-between">
                <span className="muted text-sm">Created</span>
                <strong>{formatDate(l.createdAt)}</strong>
              </div>
              {l.lostReasonCode && (
                <div className="row-between">
                  <span className="muted text-sm">Lost reason</span>
                  <Badge value={l.lostReasonCode} tone="risk" />
                </div>
              )}
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 10 }}>
              AI analysis
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="badge badge-risk">Intent: HIGH</span>
              <span className="badge badge-success">Sentiment: POSITIVE</span>
              <div className="row-between text-sm">
                <span className="muted">Conversion likelihood</span>
                <strong style={{ color: "var(--color-success)" }}>82%</strong>
              </div>
              <p className="text-sm muted" style={{ lineHeight: 1.55 }}>
                Customer asked for pricing and appointment availability but has not received follow-up for 3 days.
                Recommended action: <strong style={{ color: "var(--color-primary)" }}>follow up now</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ lead }: { lead: NonNullable<Awaited<ReturnType<typeof leadsRepo.get>>> }) {
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div>
        <div className="text-sm muted" style={{ fontWeight: 600 }}>
          NOTES
        </div>
        <p style={{ marginTop: 4 }}>{lead.notes ?? "No notes yet."}</p>
      </div>
      <div>
        <div className="text-sm muted" style={{ fontWeight: 600 }}>
          LOST REASON
        </div>
        <p style={{ marginTop: 4 }}>{lead.lostReasonCode ? labelFor(lead.lostReasonCode) : "Not lost"}</p>
      </div>
      <div>
        <div className="text-sm muted" style={{ fontWeight: 600 }}>
          STATUS HISTORY
        </div>
        <div className="stack" style={{ gap: 6, marginTop: 6 }}>
          <div className="row" style={{ gap: 8 }}>
            <Badge value="NEW" />
            <span className="text-sm muted">{formatDate(lead.createdAt)}</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Badge value={lead.status} />
            <span className="text-sm muted">{formatDate(lead.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineTab() {
  return (
    <div>
      {TIMELINE.map((e, i) => (
        <div key={i} className="row" style={{ gap: 12, alignItems: "flex-start", padding: "10px 0" }}>
          <div style={{ minWidth: 54 }} className="text-sm muted">
            {e.date}
          </div>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 99,
              marginTop: 6,
              flexShrink: 0,
              background:
                e.tone === "risk"
                  ? "var(--color-risk)"
                  : e.tone === "warning"
                  ? "var(--color-warning)"
                  : e.tone === "info"
                  ? "var(--color-info)"
                  : "var(--color-border-strong)",
            }}
          />
          <div className="text-sm" style={{ flex: 1 }}>
            {e.text}
          </div>
        </div>
      ))}
    </div>
  );
}
