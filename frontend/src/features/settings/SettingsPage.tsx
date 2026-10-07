import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

const TABS = ["Business", "Scoring", "Follow-up rules", "Users", "Billing", "Feature flags"] as const;
type Tab = (typeof TABS)[number];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Business");
  const { organization } = useAuth();
  const toast = useToast();

  return (
    <div className="page fade-in" style={{ maxWidth: 960 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">{organization?.name}</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "var(--space-5)" }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "tab-active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Business" && (
        <div className="card card-pad stack" style={{ maxWidth: 620 }}>
          <Field label="Business name" defaultValue={organization?.name} />
          <Field label="Business type" defaultValue="Dental clinic" select={["Dental clinic", "Medical clinic", "Salon", "Fitness center", "Coaching institute", "Real estate", "Travel agency", "Other"]} />
          <div className="grid grid-2">
            <Field label="Currency" defaultValue="INR (₹)" select={["INR (₹)", "USD ($)", "EUR (€)"]} />
            <Field label="Timezone" defaultValue="Asia/Kolkata (IST)" select={["Asia/Kolkata (IST)", "Asia/Dubai (GST)", "America/New_York (EST)"]} />
          </div>
          <Field label="Average customer value" defaultValue="12000" />
          <Field label="Typical sales cycle (days)" defaultValue="9" />
          <div>
            <div className="label">Working hours</div>
            <div className="row" style={{ gap: 8, marginTop: 6 }}>
              <input className="input" defaultValue="09:00" aria-label="Open time" />
              <span className="muted">to</span>
              <input className="input" defaultValue="18:00" aria-label="Close time" />
            </div>
          </div>
          <div>
            <div className="label">Lead sources</div>
            <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {["WhatsApp", "Google", "Instagram", "Walk-in", "Referral", "Website", "JustDial"].map((s) => (
                <span key={s} className="badge badge-neutral">
                  {s} ✕
                </span>
              ))}
            </div>
          </div>
          <div>
            <Button variant="primary" onClick={() => toast.success("Business settings saved")}>
              Save changes
            </Button>
          </div>
        </div>
      )}

      {tab === "Scoring" && (
        <div className="card card-pad stack" style={{ maxWidth: 620 }}>
          <p className="text-sm muted">
            Recovery score weights must sum to 100. Changes apply to future computations.
          </p>
          {(
            [
              ["Intent", 25],
              ["Engagement", 20],
              ["Value", 15],
              ["Recency", 15],
              ["Follow-up risk", 15],
              ["Appointment signal", 10],
            ] as [string, number][]
          ).map(([label, val]) => (
            <div key={label}>
              <div className="row-between">
                <span className="label">{label}</span>
                <span className="mono">{val}</span>
              </div>
              <input type="range" min={0} max={40} defaultValue={val} style={{ width: "100%" }} aria-label={label} />
            </div>
          ))}
          <div className="row-between" style={{ paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
            <strong>Total</strong>
            <strong className="mono" style={{ color: "var(--color-success)" }}>
              100
            </strong>
          </div>
          <div>
            <Button variant="primary" onClick={() => toast.success("Scoring weights saved")}>
              Save weights
            </Button>
          </div>
        </div>
      )}

      {tab === "Follow-up rules" && (
        <div className="stack" style={{ maxWidth: 720 }}>
          <div className="card card-pad row-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 650 }}>High intent, no response for 24h</div>
              <div className="text-sm muted">IF intent ≥ HIGH AND hoursSinceContact &gt; 24 → create HIGH priority follow-up</div>
            </div>
            <span className="badge badge-success">Enabled</span>
          </div>
          <div className="card card-pad row-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 650 }}>Appointment missed</div>
              <div className="text-sm muted">IF appointment.status = MISSED → create recovery task</div>
            </div>
            <span className="badge badge-success">Enabled</span>
          </div>
          <div className="card card-pad row-between" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 650 }}>Pricing asked, no reply in 48h</div>
              <div className="text-sm muted">IF askedPricing AND hoursSinceContact &gt; 48 → create URGENT follow-up</div>
            </div>
            <span className="badge badge-neutral">Disabled</span>
          </div>
          <div>
            <Button variant="primary" onClick={() => toast.success("Rule editor opens here")}>
              + New rule
            </Button>
          </div>
        </div>
      )}

      {tab === "Users" && (
        <div className="card table-wrap" style={{ maxWidth: 760 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {[
                ["Dr. Anjali Rao", "owner@smiledental.in", "OWNER"],
                ["Rahul", "rahul@smiledental.in", "EMPLOYEE"],
                ["Priya", "priya@smiledental.in", "MANAGER"],
                ["Anil", "anil@smiledental.in", "EMPLOYEE"],
              ].map(([name, email, role]) => (
                <tr key={email}>
                  <td style={{ fontWeight: 600 }}>{name}</td>
                  <td className="muted text-sm">{email}</td>
                  <td>
                    <span className={`badge ${role === "OWNER" ? "badge-info" : "badge-neutral"}`}>{role}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-pad">
            <Button variant="primary" onClick={() => toast.success("Invite sent")}>
              + Invite user
            </Button>
          </div>
        </div>
      )}

      {tab === "Billing" && (
        <div className="stack" style={{ maxWidth: 640 }}>
          <div className="card card-pad" style={{ borderLeft: "4px solid var(--color-primary)" }}>
            <div className="row-between">
              <div>
                <div className="badge badge-info">Current plan</div>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginTop: 8 }}>Business — ₹1,999/month</h3>
                <p className="text-sm muted">Renews on 20 Nov 2026 · 14-day trial active</p>
              </div>
              <Button variant="secondary">Change plan</Button>
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 14 }}>
              Usage this period
            </div>
            {[
              ["Leads", 312, 1000],
              ["AI analyses", 148, 500],
              ["Messages generated", 96, 300],
              ["Users", 4, 10],
            ].map(([label, used, limit]) => (
              <div key={String(label)} style={{ marginBottom: 12 }}>
                <div className="row-between text-sm">
                  <span>{label}</span>
                  <span className="mono">
                    {used} / {limit}
                  </span>
                </div>
                <div style={{ height: 7, background: "#eef0f3", borderRadius: 99, marginTop: 4 }}>
                  <div
                    style={{
                      width: `${(Number(used) / Number(limit)) * 100}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: "var(--color-primary)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 12 }}>
              Recovery ROI
            </div>
            <div className="grid grid-2">
              {[
                ["Subscription cost", "₹1,999", "var(--color-text)"],
                ["Potential revenue", "₹80,000", "var(--color-warning)"],
                ["Recovered revenue", "₹25,000", "var(--color-success)"],
                ["Estimated ROI", "12.5x", "var(--color-info)"],
              ].map(([label, value, color]) => (
                <div key={label} className="row-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span className="text-sm muted">{label}</span>
                  <strong style={{ color }}>{value}</strong>
                </div>
              ))}
            </div>
            <p className="text-sm muted" style={{ marginTop: 10 }}>
              Recovered revenue counts only verified records.
            </p>
          </div>
        </div>
      )}

      {tab === "Feature flags" && (
        <div className="stack" style={{ maxWidth: 640 }}>
          {[
            ["WHATSAPP_INTEGRATION", false, "Send messages directly from RevenueRadar"],
            ["AI_AUTO_SEND", false, "Automatically send approved messages (not recommended)"],
            ["ADVANCED_ANALYTICS", false, "Cohort and funnel analytics"],
            ["MULTI_LANGUAGE", false, "Telugu, Hindi, Tamil, Kannada interface"],
          ].map(([code, enabled, desc]) => (
            <div key={String(code)} className="card card-pad row-between" style={{ flexWrap: "wrap", gap: 12 }}>
              <div>
                <div className="mono" style={{ fontWeight: 650 }}>
                  {code}
                </div>
                <div className="text-sm muted">{desc}</div>
              </div>
              <span className={`badge ${enabled ? "badge-success" : "badge-neutral"}`}>
                {enabled ? "ON" : "OFF"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, defaultValue, select }: { label: string; defaultValue?: string; select?: string[] }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {select ? (
        <select className="select" defaultValue={defaultValue ?? select[0]}>
          {select.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input className="input" defaultValue={defaultValue} />
      )}
    </div>
  );
}
