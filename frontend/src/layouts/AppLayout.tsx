import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { initials } from "../utils/format";
import { isDemoData } from "../api/repository";

interface NavEntry {
  to: string;
  label: string;
  icon: string;
  section?: string;
}

const NAV: NavEntry[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/app/action-plan", label: "Action Plan", icon: "◎" },
  { to: "/app/radar", label: "Revenue Radar", icon: "◉" },
  { section: "Work", to: "", label: "", icon: "" },
  { to: "/app/leads", label: "Leads", icon: "⇉" },
  { to: "/app/customers", label: "Customers", icon: "☺" },
  { to: "/app/followups", label: "Follow-ups", icon: "⏰" },
  { to: "/app/appointments", label: "Appointments", icon: "▤" },
  { section: "Insights", to: "", label: "", icon: "" },
  { to: "/app/leakage", label: "Revenue Leakage", icon: "▽" },
  { to: "/app/reports", label: "Reports", icon: "▦" },
  { to: "/app/team", label: "Team", icon: "☰" },
  { section: "Data", to: "", label: "", icon: "" },
  { to: "/app/import", label: "Import", icon: "⇅" },
  { to: "/app/settings", label: "Settings", icon: "⚙" },
];

const MOBILE: NavEntry[] = [
  { to: "/app/dashboard", label: "Home", icon: "◈" },
  { to: "/app/action-plan", label: "Plan", icon: "◎" },
  { to: "/app/leads", label: "Leads", icon: "⇉" },
  { to: "/app/radar", label: "Radar", icon: "◉" },
  { to: "/app/customers", label: "More", icon: "☰" },
];

export function AppLayout() {
  const { user, organization, signOut, demoMode } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="shell">
      {open && <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">R</span>
          <span>RevenueRadar</span>
        </div>
        <nav className="sidebar-nav" aria-label="Main">
          {NAV.map((item, i) =>
            item.section ? (
              <div key={`sec-${i}`} className="nav-section">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className="nav-icon" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-foot">
          <div className="row" style={{ gap: 10 }}>
            <span className="avatar">{initials(user?.fullName ?? "U")}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  color: "#e2e8f0",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.fullName}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{user?.roles[0]}</div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "#94a3b8" }}
              onClick={signOut}
              title="Sign out"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="btn btn-ghost btn-sm menu-toggle"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
          <div className="row" style={{ minWidth: 0 }}>
            <strong style={{ fontSize: "var(--text-md)", letterSpacing: "-0.01em" }}>
              {organization?.name ?? "RevenueRadar"}
            </strong>
            {(demoMode || isDemoData.value) && (
              <span className="badge badge-warning" title="Using sample data — connect real leads to go live">
                Demo data
              </span>
            )}
          </div>
          <div className="search-box" style={{ marginLeft: "auto" }}>
            <input
              className="input"
              placeholder="Search customers, phone, leads…"
              aria-label="Global search"
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/app/customers?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }}
            />
          </div>
          <NavLink
            to="/app/notifications"
            className="btn btn-ghost btn-sm"
            title="Notifications"
            aria-label="Notifications"
          >
            ◔
          </NavLink>
        </header>

        <main className="content">
          <Outlet key={location.pathname} />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile">
        {MOBILE.map((m) => (
          <NavLink key={m.to} to={m.to} className={({ isActive }) => (isActive ? "active" : "")}>
            <span className="bn-icon" aria-hidden>
              {m.icon}
            </span>
            {m.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
