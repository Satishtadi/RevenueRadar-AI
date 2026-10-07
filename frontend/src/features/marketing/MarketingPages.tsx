import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

const PROBLEM = [
  { icon: "◔", title: "No follow-up", text: "70% of lost customers never received a second contact." },
  { icon: "▽", title: "No recovery system", text: "Missed appointments and silent leads quietly drain revenue." },
  { icon: "▦", title: "No visibility", text: "Owners discover leakage months too late — in the bank balance." },
];

const HOW = [
  { step: "01", title: "Import your leads", text: "Drop in a CSV from your CRM, Excel, or phone book. We clean and de-duplicate it." },
  { step: "02", title: "See your Revenue Radar", text: "Deterministic scoring ranks every customer by recovery potential — no black box." },
  { step: "03", title: "Run today's action plan", text: "Follow a prioritized list: who to call, what to say, in which language." },
  { step: "04", title: "Track recovered revenue", text: "Only verified wins count. Watch ROI climb against your subscription." },
];

const STATS = [
  ["₹1.4L", "Average revenue recovered in 90 days"],
  ["31%", "Of leakage caused by delayed follow-up"],
  ["9 min", "To first insight after import"],
];

export function LandingPage() {
  return (
    <div className="marketing">
      <header className="mkt-header">
        <div className="mkt-container row-between">
          <Link to="/" className="row" style={{ gap: 10, textDecoration: "none", color: "inherit" }}>
            <span className="brand-mark">R</span>
            <strong style={{ fontSize: "var(--text-md)" }}>RevenueRadar AI</strong>
          </Link>
          <nav className="row" style={{ gap: 8 }}>
            <Link to="/pricing" className="btn btn-ghost btn-sm">
              Pricing
            </Link>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <section className="mkt-hero">
        <div className="mkt-container">
          <span className="badge badge-warning" style={{ marginBottom: 16 }}>
            For clinics, salons, fitness studios & service SMBs
          </span>
          <h1>
            Find the customers you're losing.
            <br />
            <span style={{ color: "var(--color-primary)" }}>Recover them before they're gone.</span>
          </h1>
          <p className="mkt-sub">
            RevenueRadar scores every lead and customer for recovery potential, hands you a daily action plan,
            and tracks the revenue you win back — so silent customers stop being invisible.
          </p>
          <div className="row" style={{ gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <Link to="/register">
              <Button variant="primary" size="lg">
                Start free — 14 days
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Explore demo data
              </Button>
            </Link>
          </div>
          <div className="mkt-stats">
            {STATS.map(([v, l]) => (
              <div key={l}>
                <div className="mkt-stat-value">{v}</div>
                <div className="mkt-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ background: "var(--color-surface-2)" }}>
        <div className="mkt-container">
          <h2 className="mkt-h2">Revenue is leaking in three places</h2>
          <div className="mkt-grid3">
            {PROBLEM.map((p) => (
              <div key={p.title} className="card card-pad">
                <div style={{ fontSize: 26, color: "var(--color-risk)" }}>{p.icon}</div>
                <h3 style={{ fontWeight: 700, marginTop: 8 }}>{p.title}</h3>
                <p className="text-sm muted" style={{ marginTop: 6 }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <h2 className="mkt-h2">How it works</h2>
          <div className="mkt-grid4">
            {HOW.map((h) => (
              <div key={h.step} className="card card-pad">
                <div className="mono" style={{ color: "var(--color-primary)", fontWeight: 750 }}>
                  {h.step}
                </div>
                <h3 style={{ fontWeight: 700, marginTop: 6, fontSize: "var(--text-base)" }}>{h.title}</h3>
                <p className="text-sm muted" style={{ marginTop: 6 }}>
                  {h.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section" style={{ background: "var(--color-surface-2)" }}>
        <div className="mkt-container">
          <h2 className="mkt-h2">What you get, every day</h2>
          <div className="mkt-grid3">
            {[
              ["◉", "Revenue Radar", "Ranked at-risk and lost customers with a transparent recovery score."],
              ["◎", "Daily action plan", "A prioritized list of who to contact and what to say — English, Telugu, and more."],
              ["▽", "Leakage analysis", "Exactly why customers leave and what each lost reason costs you."],
            ].map(([icon, title, text]) => (
              <div key={title} className="card card-pad">
                <div style={{ fontSize: 24, color: "var(--color-info)" }}>{icon}</div>
                <h3 style={{ fontWeight: 700, marginTop: 8 }}>{title}</h3>
                <p className="text-sm muted" style={{ marginTop: 6 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm muted" style={{ marginTop: 20, textAlign: "center" }}>
            AI drafts your messages and insights — you approve before anything is sent. No autonomous sending, ever.
          </p>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-container">
          <div className="card card-pad" style={{ textAlign: "center", padding: "var(--space-12)", background: "var(--color-primary)", color: "#fff", border: "none" }}>
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800 }}>Start recovering revenue today</h2>
            <p style={{ opacity: 0.85, marginTop: 8 }}>Import 50 leads free. See your first revenue leak in minutes.</p>
            <div style={{ marginTop: 22 }}>
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Create free account →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mkt-footer">
        <div className="mkt-container row-between" style={{ flexWrap: "wrap", gap: 12 }}>
          <span className="text-sm muted">© 2026 RevenueRadar AI</span>
          <div className="row" style={{ gap: 16 }}>
            <Link to="/pricing" className="text-sm muted">
              Pricing
            </Link>
            <Link to="/login" className="text-sm muted">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const TIERS = [
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    blurb: "Solo operators getting their follow-up under control.",
    features: ["Up to 500 leads", "Revenue Radar & action plan", "3 AI analyses / day", "1 user", "CSV import"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Business",
    price: "₹1,999",
    period: "/month",
    blurb: "Growing teams that need recovery to be a system, not a memory.",
    features: [
      "Up to 5,000 leads",
      "Everything in Starter",
      "100 AI analyses / day",
      "Multi-language message drafts",
      "Leakage & team reports",
      "Up to 10 users",
    ],
    cta: "Start free",
    featured: true,
  },
  {
    name: "Scale",
    price: "₹4,999",
    period: "/month",
    blurb: "Multi-location businesses with custom recovery playbooks.",
    features: [
      "Unlimited leads",
      "Everything in Business",
      "Custom scoring & rules engine",
      "WhatsApp integration (pending approval)",
      "Priority support",
      "Unlimited users",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

export function PricingPage() {
  return (
    <div className="marketing">
      <header className="mkt-header">
        <div className="mkt-container row-between">
          <Link to="/" className="row" style={{ gap: 10, textDecoration: "none", color: "inherit" }}>
            <span className="brand-mark">R</span>
            <strong style={{ fontSize: "var(--text-md)" }}>RevenueRadar AI</strong>
          </Link>
          <nav className="row" style={{ gap: 8 }}>
            <Link to="/" className="btn btn-ghost btn-sm">
              ← Home
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <section className="mkt-section">
        <div className="mkt-container" style={{ textAlign: "center" }}>
          <h1 className="mkt-h2">Simple pricing, measurable return</h1>
          <p className="mkt-sub" style={{ margin: "10px auto 0" }}>
            Every plan pays for itself with one recovered customer. 14-day free trial, no card required.
          </p>

          <div className="mkt-grid3" style={{ marginTop: 40, textAlign: "left" }}>
            {TIERS.map((t) => (
              <div
                key={t.name}
                className="card card-pad"
                style={t.featured ? { borderColor: "var(--color-primary)", boxShadow: "var(--shadow-md)" } : undefined}
              >
                {t.featured && (
                  <span className="badge badge-primary" style={{ marginBottom: 10 }}>
                    Most popular
                  </span>
                )}
                <div style={{ fontWeight: 700 }}>{t.name}</div>
                <div className="row" style={{ alignItems: "baseline", gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800 }}>{t.price}</span>
                  <span className="muted text-sm">{t.period}</span>
                </div>
                <p className="text-sm muted" style={{ marginTop: 6 }}>
                  {t.blurb}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "16px 0", display: "grid", gap: 8 }}>
                  {t.features.map((f) => (
                    <li key={f} className="row" style={{ gap: 8, fontSize: "var(--text-sm)" }}>
                      <span style={{ color: "var(--color-success)" }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button variant={t.featured ? "primary" : "secondary"} block>
                    {t.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="card card-pad" style={{ marginTop: 36, textAlign: "left" }}>
            <div className="card-title">Frequently asked</div>
            <div className="stack" style={{ marginTop: 14, gap: 14 }}>
              {[
                ["Is my data isolated to my business?", "Yes. Every query is scoped to your organization from the JWT — no shared data, ever."],
                ["Does AI send messages automatically?", "No. AI only drafts. You copy and send yourself; WhatsApp integration arrives behind an explicit approval flow."],
                ["How is Recovered Revenue calculated?", "Only from records you mark as recovered — we never let a predicted amount show up as real revenue."],
                ["Can I cancel anytime?", "Yes. Cancel from Billing and you keep access until the end of the period."],
              ].map(([q, a]) => (
                <div key={q}>
                  <div style={{ fontWeight: 650 }}>{q}</div>
                  <div className="text-sm muted" style={{ marginTop: 3 }}>
                    {a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mkt-footer">
        <div className="mkt-container">
          <span className="text-sm muted">© 2026 RevenueRadar AI</span>
        </div>
      </footer>
    </div>
  );
}
