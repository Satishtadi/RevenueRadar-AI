import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStore } from "../../api/client";
import type { Organization, Role, User } from "../../api/types";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  demoMode: boolean;
  signIn: (user: User, org: Organization | null) => void;
  signOut: () => void;
}

const Ctx = createContext<AuthState | null>(null);

const DEMO_USER: User = {
  id: "demo-owner",
  fullName: "Dr. Anjali Rao",
  email: "owner@smiledental.in",
  roles: ["OWNER"],
  organizationId: "org-demo",
};

const DEMO_ORG: Organization = {
  id: "org-demo",
  name: "Smile Dental Studio",
  businessType: "DENTAL_CLINIC",
  currency: "INR",
  timezone: "Asia/Kolkata",
  onboarded: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("rra_session");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { user: User; organization: Organization | null };
        setUser(parsed.user);
        setOrganization(parsed.organization);
      } catch {
        sessionStorage.removeItem("rra_session");
      }
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      organization,
      isAuthenticated: user !== null,
      demoMode,
      signIn: (u, org) => {
        setUser(u);
        setOrganization(org);
        setDemoMode(u.id === DEMO_USER.id);
        sessionStorage.setItem("rra_session", JSON.stringify({ user: u, organization: org }));
      },
      signOut: () => {
        setUser(null);
        setOrganization(null);
        setDemoMode(false);
        tokenStore.clear();
        sessionStorage.removeItem("rra_session");
        window.location.href = "/login";
      },
    }),
    [user, organization, demoMode]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function hasRole(user: User | null, ...roles: Role[]): boolean {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r));
}

export { DEMO_USER, DEMO_ORG };
