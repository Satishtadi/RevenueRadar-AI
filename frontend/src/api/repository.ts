import { api, toApiError, ApiError, tokenStore } from "./client";
import type {
  ActionPlanItem,
  Appointment,
  Customer,
  DashboardPulse,
  FollowUp,
  GeneratedMessage,
  Lead,
  LeadReportRow,
  PagedResponse,
  RadarCategory,
  RadarSummary,
  RecoveryAction,
  RevenueSummary,
  TeamMember,
} from "./types";
import * as demo from "./demo/fixtures";

/**
 * The UI talks to the real backend. While backend phases are still landing,
 * any endpoint that does not exist yet falls back to demo fixtures so the
 * product stays demoable end-to-end. Once an endpoint ships, it is used
 * automatically — no UI changes required.
 */
const NOT_IMPLEMENTED = new Set([404, 501]);

async function withFallback<T>(call: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await call();
  } catch (error) {
    const apiError = toApiError(error);
    if (
      NOT_IMPLEMENTED.has(apiError.status) ||
      apiError.code === "NETWORK_ERROR" ||
      // 401 without a token = anonymous/demo visitor on a protected endpoint
      (apiError.status === 401 && !tokenStore.access)
    ) {
      return fallback();
    }
    throw apiError;
  }
}

export const isDemoData = { value: false };

function markDemo<T>(value: T): T {
  isDemoData.value = true;
  return value;
}

export const revenueRepo = {
  summary: () =>
    withFallback(
      async () => (await api.get<never, { data: RevenueSummary }>("/revenue/summary")).data,
      () => markDemo(demo.demoRevenue)
    ),
};

export const dashboardRepo = {
  pulse: () =>
    withFallback(
      async () => (await api.get<never, { data: DashboardPulse }>("/recovery/action-plan/pulse")).data,
      () => markDemo(demo.demoPulse)
    ),
  radarSummary: () =>
    withFallback(
      async () => (await api.get<never, { data: RadarSummary }>("/recovery/radar/summary")).data,
      () => markDemo(demo.demoRadar)
    ),
  actionPlan: () =>
    withFallback(
      async () =>
        (await api.get<never, { data: { items: ActionPlanItem[] } }>("/recovery/action-plan/today")).data.items,
      () => markDemo(demo.demoActionPlan)
    ),
};

export const leadsRepo = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    withFallback(
      async () => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== "") qs.set(k, String(v));
        });
        const res = await api.get<never, { data: PagedResponse<Lead> }>(`/leads?${qs}`);
        return res.data;
      },
      () => {
        const filtered = filterLeads(demo.demoLeads, params);
        return markDemo(page(filtered, Number(params.page ?? 0), Number(params.size ?? 12)));
      }
    ),
  get: (id: string) =>
    withFallback(
      async () => (await api.get<never, { data: Lead }>(`/leads/${id}`)).data,
      () => markDemo(demo.demoLeads.find((l) => l.id === id)!)
    ),
  score: (id: string) =>
    withFallback(
      async () => (await api.get<never, { data: Lead }>(`/leads/${id}/score`)).data.recoveryScore!,
      () => markDemo(demo.demoLeads.find((l) => l.id === id)!.recoveryScore!)
    ),
};

function filterLeads(rows: Lead[], params: Record<string, string | number | undefined>): Lead[] {
  let out = rows;
  const q = String(params.q ?? "").toLowerCase().trim();
  if (q) out = out.filter((l) => l.customerName.toLowerCase().includes(q) || l.service?.toLowerCase().includes(q));
  if (params.status) out = out.filter((l) => l.status === params.status);
  if (params.priority) out = out.filter((l) => l.priority === params.priority);
  if (params.assignedUserName) out = out.filter((l) => l.assignedUserName === params.assignedUserName);
  if (params.service) out = out.filter((l) => l.service === params.service);
  return out;
}

function page<T>(rows: T[], p: number, size: number): PagedResponse<T> {
  const start = p * size;
  return {
    content: rows.slice(start, start + size),
    page: p,
    size,
    totalElements: rows.length,
    totalPages: Math.ceil(rows.length / size),
  };
}

export const customersRepo = {
  list: (params: Record<string, string | number | undefined> = {}) =>
    withFallback(
      async () => {
        const qs = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== "") qs.set(k, String(v));
        });
        const res = await api.get<never, { data: PagedResponse<Customer> }>(`/customers?${qs}`);
        return res.data;
      },
      () => {
        let out = demo.demoCustomers;
        const q = String(params.q ?? "").toLowerCase().trim();
        if (q) {
          out = out.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.phone?.includes(q) ||
              c.email?.toLowerCase().includes(q)
          );
        }
        return markDemo(page(out, Number(params.page ?? 0), Number(params.size ?? 12)));
      }
    ),
};

export const recoveryRepo = {
  radar: (category?: RadarCategory) =>
    withFallback(
      async () => {
        const res = await api.get<never, { data: PagedResponse<RecoveryAction> }>(
          `/recovery/radar${category ? `?category=${category}` : ""}`
        );
        return res.data;
      },
      () => {
        const rows = category ? demo.demoRecoveryActions.filter((a) => a.category === category) : demo.demoRecoveryActions;
        return markDemo(page(rows, 0, 50));
      }
    ),
};

export const followUpsRepo = {
  list: (params: Record<string, string | undefined> = {}) =>
    withFallback(
      async () => {
        const qs = new URLSearchParams(params as Record<string, string>);
        const res = await api.get<never, { data: PagedResponse<FollowUp> }>(`/followups?${qs}`);
        return res.data;
      },
      () => {
        let rows = demo.demoFollowUps;
        if (params.due === "today") rows = rows.filter((f) => sameDay(new Date(f.dueAt), new Date()) && f.status === "PENDING");
        if (params.due === "overdue") rows = rows.filter((f) => f.status === "OVERDUE");
        if (params.due === "upcoming") rows = rows.filter((f) => f.status === "PENDING" && new Date(f.dueAt) > new Date());
        if (params.status) rows = rows.filter((f) => f.status === params.status);
        return markDemo(page(rows, 0, 50));
      }
    ),
};

export const appointmentsRepo = {
  list: () =>
    withFallback(
      async () => {
        const res = await api.get<never, { data: PagedResponse<Appointment> }>("/appointments");
        return res.data;
      },
      () => markDemo(page(demo.demoAppointments, 0, 50))
    ),
};

export const aiRepo = {
  generateMessage: (input: { leadId: string; channel: string; language: "EN" | "TE" }) =>
    withFallback(
      async () =>
        (await api.post<never, { data: GeneratedMessage }>("/ai/messages/generate", input)).data,
      () => {
        const lead = demo.demoLeads.find((l) => l.id === input.leadId)!;
        const template = demo.demoMessages[input.language];
        const content = template
          .replace("{name}", lead.customerName.split(" ")[0])
          .replace("{service}", (lead.service ?? "treatment").toLowerCase());
        return markDemo({
          id: `msg-${Date.now()}`,
          leadId: input.leadId,
          channel: input.channel as GeneratedMessage["channel"],
          language: input.language,
          content,
          status: "DRAFT" as const,
        });
      }
    ),
};

export const reportsRepo = {
  lostReasons: () =>
    withFallback(
      async () => (await api.get<never, { data: LeadReportRow[] }>("/reports/lost-customers")).data,
      () => markDemo(demo.demoLostReport)
    ),
  teamPerformance: () =>
    withFallback(
      async () => (await api.get<never, { data: TeamMember[] }>("/reports/team-performance")).data,
      () => markDemo(demo.demoTeam)
    ),
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export { ApiError };
