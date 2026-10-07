import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, DEMO_USER, DEMO_ORG } from "./AuthContext";
import { Button } from "../../components/ui/Button";
import { tokenStore } from "../../api/client";
import { api, toApiError } from "../../api/client";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const session = res.data.data;
      tokenStore.set(session.accessToken, session.refreshToken);
      signIn(session.user, session.organization);
      navigate("/app/dashboard");
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === "NETWORK_ERROR" || apiError.status === 404) {
        signIn(DEMO_USER, DEMO_ORG);
        navigate("/app/dashboard");
        return;
      }
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card card-pad">
        <div className="row" style={{ gap: 10, marginBottom: 6 }}>
          <span className="brand-mark">R</span>
          <strong style={{ fontSize: "var(--text-lg)" }}>RevenueRadar AI</strong>
        </div>
        <p className="muted text-sm" style={{ marginBottom: 20 }}>
          Find the customers you're losing. Recover them before they're gone.
        </p>

        <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              required
              autoComplete="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="error-text" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="row-between" style={{ marginTop: 16 }}>
          <Link to="/forgot-password" className="text-sm" style={{ color: "var(--color-primary)" }}>
            Forgot password?
          </Link>
          <Link to="/register" className="text-sm" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Create account →
          </Link>
        </div>

        <hr className="divider" style={{ margin: "18px 0" }} />
        <Button variant="secondary" block onClick={() => { signIn(DEMO_USER, DEMO_ORG); navigate("/app/dashboard"); }}>
          ▶ Explore with demo data
        </Button>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", orgName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/register", form);
      const session = res.data.data;
      tokenStore.set(session.accessToken, session.refreshToken);
      signIn(session.user, session.organization);
      navigate("/onboarding");
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === "NETWORK_ERROR" || apiError.status === 404) {
        signIn({ ...DEMO_USER, fullName: form.fullName || DEMO_USER.fullName, email: form.email || DEMO_USER.email, organizationId: "org-demo" }, { ...DEMO_ORG, name: form.orgName || DEMO_ORG.name, onboarded: false });
        navigate("/onboarding");
        return;
      }
      setError(apiError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card card-pad">
        <div className="row" style={{ gap: 10, marginBottom: 6 }}>
          <span className="brand-mark">R</span>
          <strong style={{ fontSize: "var(--text-lg)" }}>Start free — 14 days</strong>
        </div>
        <p className="muted text-sm" style={{ marginBottom: 20 }}>
          No card required. Import 50 leads and see your first revenue leak in minutes.
        </p>

        <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label className="label" htmlFor="fullName">
              Your name
            </label>
            <input id="fullName" className="input" required autoComplete="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="orgName">
              Business name
            </label>
            <input id="orgName" className="input" required placeholder="Smile Dental Studio" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="regEmail">
              Email
            </label>
            <input id="regEmail" className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label className="label" htmlFor="regPassword">
              Password
            </label>
            <input id="regPassword" className="input" type="password" required autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && (
            <div className="error-text" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy ? "Creating…" : "Create my account"}
          </Button>
        </form>

        <p className="text-sm muted" style={{ marginTop: 16, textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
