import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { api, toApiError } from "../../api/client";

const STEPS = ["Business type", "Your goals", "Import leads", "Done"] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { organization } = useAuth();
  const [step, setStep] = useState(0);
  const [businessType, setBusinessType] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  const toggle = (g: string) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  const finish = async () => {
    try {
      await api.patch(`/organizations/${organization?.id ?? "org-demo"}`, { businessType, goals });
    } catch (err) {
      const e = toApiError(err);
      if (e.code !== "NETWORK_ERROR" && e.status !== 404) toast.error(e.message);
    }
    setStep(3);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card card-pad" style={{ maxWidth: 560 }}>
        <div className="row" style={{ gap: 6, marginBottom: 18 }}>
          {STEPS.map((s, i) => (
            <div key={s} className="row" style={{ gap: 6 }}>
              <span
                className="badge"
                style={{
                  background: i <= step ? "var(--color-primary)" : "var(--color-neutral-soft)",
                  color: i <= step ? "#fff" : "var(--color-muted)",
                  borderColor: "transparent",
                }}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="muted">→</span>}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 750 }}>What kind of business do you run?</h1>
            <p className="muted text-sm" style={{ marginTop: 6 }}>
              This tunes scoring rules and recovery templates to your industry.
            </p>
            <div className="grid grid-2" style={{ marginTop: 18 }}>
              {["Dental clinic", "Medical clinic", "Salon", "Fitness center", "Coaching institute", "Real estate", "Travel agency", "Other"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className="card card-pad"
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor: businessType === t ? "var(--color-primary)" : undefined,
                    background: businessType === t ? "var(--color-primary-soft)" : undefined,
                  }}
                  onClick={() => setBusinessType(t)}
                >
                  <strong style={{ fontSize: "var(--text-sm)" }}>{t}</strong>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <Button variant="primary" size="lg" block disabled={!businessType} onClick={() => setStep(1)}>
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 750 }}>What do you want to fix first?</h1>
            <p className="muted text-sm" style={{ marginTop: 6 }}>
              Pick any that apply — your dashboard will prioritize them.
            </p>
            <div className="stack" style={{ marginTop: 18, gap: 10 }}>
              {[
                "Follow-ups are slipping through the cracks",
                "Missed appointments cost me revenue",
                "I don't know why customers go quiet",
                "I want a daily to-do list for recovery",
                "I need visibility across my team",
              ].map((g) => (
                <button
                  key={g}
                  type="button"
                  className="card card-pad row-between"
                  style={{
                    cursor: "pointer",
                    textAlign: "left",
                    borderColor: goals.includes(g) ? "var(--color-primary)" : undefined,
                    background: goals.includes(g) ? "var(--color-primary-soft)" : undefined,
                  }}
                  onClick={() => toggle(g)}
                >
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 550 }}>{g}</span>
                  <span>{goals.includes(g) ? "✓" : "+"}</span>
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 10, marginTop: 20 }}>
              <Button variant="ghost" onClick={() => setStep(0)}>
                ← Back
              </Button>
              <Button variant="primary" size="lg" style={{ flex: 1 }} disabled={goals.length === 0} onClick={() => setStep(2)}>
                Continue →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 750 }}>Import your first 50 leads</h1>
            <p className="muted text-sm" style={{ marginTop: 6 }}>
              A CSV with name and phone is enough. You can do this later from the Import screen.
            </p>
            <div
              className="card card-pad"
              style={{ marginTop: 18, textAlign: "center", border: "2px dashed var(--color-border-strong)", background: "var(--color-surface-2)" }}
            >
              <div style={{ fontSize: 30 }}>⇅</div>
              <div style={{ fontWeight: 650, marginTop: 6 }}>Drag a CSV here</div>
              <div className="text-sm muted">or</div>
              <div style={{ marginTop: 12 }}>
                <Button variant="secondary" onClick={() => toast.success("Choose a file from the Import screen")}>
                  Browse files
                </Button>
              </div>
            </div>
            <div className="row" style={{ gap: 10, marginTop: 20 }}>
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setStep(3)}>
                Skip for now
              </Button>
              <Button variant="primary" size="lg" onClick={finish}>
                Import & finish →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in" style={{ textAlign: "center", padding: "var(--space-8) 0" }}>
            <div style={{ fontSize: 46, color: "var(--color-success)" }}>✓</div>
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 750, marginTop: 8 }}>You're all set</h1>
            <p className="muted text-sm" style={{ marginTop: 8 }}>
              Your Revenue Radar is ready. Start with today's action plan — it's the fastest path to recovered
              revenue.
            </p>
            <div className="stack" style={{ marginTop: 24, gap: 10 }}>
              <Button variant="primary" size="lg" block onClick={() => navigate("/app/action-plan")}>
                Open today's action plan →
              </Button>
              <Button variant="secondary" block onClick={() => navigate("/app/dashboard")}>
                Go to dashboard
              </Button>
            </div>
            <p className="text-sm muted" style={{ marginTop: 18 }}>
              Need help? <Link to="/app/settings" style={{ color: "var(--color-primary)" }}>Review settings</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const toast = useToast();

  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card card card-pad" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, color: "var(--color-success)" }}>✓</div>
          <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 750, marginTop: 8 }}>Check your inbox</h1>
          <p className="text-sm muted" style={{ marginTop: 6 }}>
            If an account exists for {email}, a reset link is on its way.
          </p>
          <div style={{ marginTop: 20 }}>
            <Link to="/login">
              <Button variant="primary" block>
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card card card-pad">
        <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 750 }}>Reset your password</h1>
        <p className="text-sm muted" style={{ marginTop: 6, marginBottom: 18 }}>
          We'll email you a secure link to set a new password.
        </p>
        <form
          className="stack"
          style={{ gap: 14 }}
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Reset link sent");
          }}
        >
          <div className="field">
            <label className="label" htmlFor="resetEmail">
              Email
            </label>
            <input
              id="resetEmail"
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="lg" block>
            Send reset link
          </Button>
        </form>
        <p className="text-sm muted" style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/login" style={{ color: "var(--color-primary)" }}>
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
