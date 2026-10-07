import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth, hasRole } from "../features/auth/AuthContext";
import { AppLayout } from "../layouts/AppLayout";
import { LandingPage, PricingPage } from "../features/marketing/MarketingPages";
import { LoginPage, RegisterPage } from "../features/auth/AuthPages";
import { ForgotPasswordPage, OnboardingPage } from "../features/onboarding/OnboardingPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ActionPlanPage, RecoverySessionPage } from "../features/recovery/ActionPlanPage";
import { RadarPage } from "../features/radar/RadarPage";
import { LeadsPage } from "../features/leads/LeadsPage";
import { LeadDetailPage } from "../features/leads/LeadDetailPage";
import { CustomersPage } from "../features/customers/CustomersPage";
import { FollowUpsPage } from "../features/followups/FollowUpsPage";
import { AppointmentsPage } from "../features/appointments/AppointmentsPage";
import { LeakagePage } from "../features/reports/LeakagePage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { TeamPage } from "../features/team/TeamPage";
import { ImportPage } from "../features/import/ImportPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { NotificationsPage } from "../features/notifications/NotificationsPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function RequireRole({ roles, children }: { roles: Parameters<typeof hasRole>[1][]; children: ReactNode }) {
  const { user } = useAuth();
  if (!hasRole(user, ...roles)) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/app/dashboard" : "/"} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />

      <Route path="/home" element={<HomeRedirect />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="action-plan" element={<ActionPlanPage />} />
        <Route path="recovery/session/:sessionId" element={<RecoverySessionPage />} />
        <Route path="radar" element={<RadarPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:leadId" element={<LeadDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="followups" element={<FollowUpsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="leakage" element={<LeakagePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="team"
          element={
            <RequireRole roles={["OWNER", "MANAGER", "SUPER_ADMIN"]}>
              <TeamPage />
            </RequireRole>
          }
        />
        <Route path="import" element={<ImportPage />} />
        <Route
          path="settings"
          element={
            <RequireRole roles={["OWNER", "SUPER_ADMIN"]}>
              <SettingsPage />
            </RequireRole>
          }
        />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
