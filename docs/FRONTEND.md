# RevenueRadar AI — Frontend Architecture

React 18 + TypeScript + Vite. One SPA with two shells: **Marketing** (public) and **App** (authenticated).

---

## 1. Route Map

### Marketing (public)
| Route | Page |
|---|---|
| `/` | Landing page (hero, problem, how it works, radar, score, action plan, before/after, use cases, pricing teaser, FAQ, CTA) |
| `/pricing` | Plans (fetched from `GET /settings/plans` — never hard-coded) |
| `/demo` | Polished demo environment (demo tenant, read-only + sandbox actions) |
| `/calculator` | Free Revenue Leak Calculator (lead-gen tool) |
| `/login` `/register` | Auth |
| `/forgot-password` `/reset-password` | Password flows |
| `/privacy` `/terms` | Static |

### App (authenticated, `RequireAuth` + `AppLayout`)
| Route | Page | Roles |
|---|---|---|
| `/app` | redirect → `/app/dashboard` | |
| `/app/dashboard` | **Main dashboard** (revenue cards, radar summary, follow-ups due, action plan teaser) | all |
| `/app/action-plan` | Today's AI Action Plan + **Start Recovery Session** flow | all |
| `/app/radar` | Revenue Radar (category tabs, filters, rows) | all |
| `/app/leads` · `/app/leads/:id` | Lead list · lead detail (timeline, score breakdown, AI panel, messages) | all* |
| `/app/customers` · `/app/customers/:id` | Customer list · profile (tabs: overview, timeline, leads, conversations, appointments, revenue, AI, recovery history) | all* |
| `/app/followups` | Follow-up board (today / overdue / upcoming) + rules tab | all* |
| `/app/appointments` | Calendar/list view | all* |
| `/app/conversations` | Conversation list + manual entry | all* |
| `/app/recovery/session/:id` | Guided one-click recovery session (full-screen) | all |
| `/app/import` · `/app/import/:jobId` | CSV upload → column mapping → validate → progress → summary | OWNER, MANAGER |
| `/app/reports` + `/app/reports/:type` | lead, conversion, revenue, recovery, team, lost, followups | OWNER, MANAGER |
| `/app/leakage` | Revenue Leakage Analysis (lost reasons) | OWNER, MANAGER |
| `/app/team` | Team performance | OWNER, MANAGER |
| `/app/notifications` | Notification center | all |
| `/app/settings/*` | profile, business, services, scoring, follow-up rules, features, billing, users | per section |
| `/app/billing` | plan, usage meters, ROI card | OWNER |
| `/app/admin/*` | platform admin (orgs, users, AI usage, health, flags, plans) | SUPER_ADMIN only |

\* EMPLOYEE: sees assigned leads/customers only (server enforces; UI hides what it can).

### Post-registration flow
`/onboarding` — 10-step wizard (save-and-resume via `GET /organizations/onboarding/status`), then:
`/app/import` (or **Load Demo Data**) → after first import: **First Wow Moment** screen (`/app/wow`) showing analyzed counts, high recovery opportunities, potential revenue, biggest leak.

---

## 2. Folder Structure

```text
frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx
    ├── app/
    │   ├── App.tsx                # router + providers
    │   ├── routes/                # route tables, guards (RequireAuth, RequireRole)
    │   └── providers/             # QueryClient, Auth, Theme, I18n-ready
    ├── api/
    │   ├── client.ts              # axios instance + auth/refresh interceptors
    │   ├── types.ts               # ApiResponse, PagedResponse, error shape
    │   └── endpoints/             # one file per resource: leads.ts, revenue.ts ...
    ├── components/
    │   ├── ui/                    # Button, Card, Badge, Modal, Table, Tabs,
    │   │                          # Input, Select, Toast, EmptyState, Skeleton,
    │   │                          # StatCard, ScoreRing, Drawer, Pagination
    │   └── layout/                # Sidebar, Topbar, PageHeader, MobileNav
    ├── features/
    │   ├── auth/                  # login, register, forgot password
    │   ├── onboarding/
    │   ├── dashboard/
    │   ├── radar/
    │   ├── actionplan/
    │   ├── leads/
    │   ├── customers/
    │   ├── followups/
    │   ├── appointments/
    │   ├── conversations/
    │   ├── recovery/              # session wizard, score breakdown UI
    │   ├── ai/                    # analysis panel, message generator (Approve/Copy)
    │   ├── import/                # upload, mapping table, progress, summary
    │   ├── reports/
    │   ├── leakage/
    │   ├── team/
    │   ├── billing/
    │   ├── settings/
    │   ├── notifications/
    │   └── admin/
    ├── hooks/                     # useAuth, useDebounce, usePagination, useMediaQuery
    ├── pages/                     # thin: lazy-loaded route components → feature modules
    ├── layouts/                   # AppLayout, MarketingLayout, AuthLayout
    ├── styles/
    │   ├── tokens.css             # colors, spacing, typography, radii, shadows
    │   ├── global.css
    │   └── components.css
    ├── types/                     # domain types mirroring API DTOs
    └── utils/                     # formatters (currency ₹, dates by org TZ), validators, constants
```

Rules:
- No component > 300 lines; split by subcomponent.
- All server state through TanStack Query hooks (`useLeads`, `useRevenueSummary`, ...) — no hand-rolled fetch-in-component.
- Business logic (formatting, filtering helpers) in `utils/`, pure and unit-tested.
- No API base URL or secrets baked in — `import.meta.env.VITE_API_BASE_URL`.

---

## 3. Key Screen Designs

### 3.1 Main dashboard (the product's face — not a generic CRM)

```text
┌ Sidebar ─┐┌ Topbar: org name · search · notifications · user ────────────────┐
│ Dashboard │                                                                  │
│ Radar     │  REVENUE SUMMARY (4 StatCards, semantic colors)                  │
│ Action    │  ┌──────────────┬───────────────┬──────────────┬───────────────┐ │
│ Plan      │  │Revenue At Risk│ Potential     │ Recovered*   │ ROI           │ │
│ Leads     │  │ ₹4,82,000    │ ₹1,27,000     │ ₹48,000      │ 12.5x         │ │
│ Customers │  │ red          │ orange        │ green ✓      │ blue          │ │
│ Follow-ups│  └──────────────┴───────────────┴──────────────┴───────────────┘ │
│ Appts     │  PULSE ROW: High Priority 17 · Due Today 29 · Overdue 11 ·       │
│ Radar     │            Silent 41 · Missed Appts 8                            │
│ Import    │                                                                  │
│ Reports   │  TODAY'S AI ACTION PLAN (top 5 + [Start Recovery Session])       │
│ ...       │  REVENUE RADAR categories (compact count + value chips)          │
│           │  LEAKAGE SNACKER: "Biggest leak: delayed follow-up (31%)"        │
└───────────┘  RECENT ACTIVITY / follow-ups due today (list)                   │
```

- `*Recovered` card renders only with verified data; otherwise shows "Potential" label (honesty rule §109).
- Mobile (<768px): sidebar → bottom nav (Dashboard, Action Plan, Leads, Radar, More); StatCards stack 1-col.

### 3.2 Revenue Radar page
Category tabs/chips (High Priority, Follow-up Overdue, Silent, Missed Appointment, High Value, Lost, Recovery Opportunity) → each with count + potential value → paged table → row click = lead detail.

### 3.3 Recovery Session (`/app/recovery/session/:id`)
Full-screen card flow:
`Customer · ScoreRing(96) · WHY (factors list) · AI recommendation · [Generate] → message box with [Edit][Regenerate][Copy][Approve] · [Mark Contacted] [Skip]` → auto-advance → completion summary ("6 of 7 contacted, ₹82,000 potential covered").

### 3.4 AI message generator (lead detail)
Channel tabs (WhatsApp/Email/SMS), language select (English / తెలుగు), draft textarea, actions: **Edit · Regenerate · Copy · Approve**. (No "Send" until MessagingProvider exists.)

### 3.5 Import wizard
```text
Upload → detected headers + 5 sample rows
       → mapping table (CSV column ▾ system field)
       → Validate (dry-run: 500 found / 480 valid / 12 dup / 8 invalid)
       → Import with progress bar (40%)
       → Summary + [Download error report]
       → CTA: [View your Revenue Radar]
```

---

## 4. Design System

CSS variables in `tokens.css` (no framework):

```css
--color-risk: #DC2626;      /* red    = risk/overdue/lost          */
--color-warning: #EA580C;   /* orange = warning/potential          */
--color-success: #16A34A;   /* green  = recovered/success          */
--color-info: #2563EB;      /* blue   = information/AI             */
--color-neutral: #6B7280;   /* gray   = neutral                   */
--color-bg, --color-surface, --color-border, --color-text, --color-muted
--radius-sm/md/lg; --shadow-sm/md; --space-1..8; --font sizes
```

Principles:
- Revenue numbers are the visual hierarchy — largest text on any screen.
- Cards, generous whitespace, one primary CTA per view.
- Charts only where they add insight (leakage donut, revenue trend line) — max 2 per screen.
- Status = color + label + icon (never color alone — accessibility).
- Responsive breakpoints: 1440 / 1024 / 768 / 480.
- Dark mode: tokens make it cheap later; not MVP.
- i18n-ready: all user-facing strings via `t('key')` helper (English dictionary only in MVP).

---

## 5. Auth Handling (frontend)

- Access token in memory; refresh token via httpOnly cookie **or** memory (decided in Phase 3: MVP = response body + sessionStorage, documented trade-off, switch to httpOnly cookie when served same-site in prod).
- Axios interceptor: attach token, on 401 → silent refresh once → retry; on refresh fail → logout.
- Route guards: `RequireAuth`, `RequireRole(['OWNER','MANAGER'])`.
- Never trust UI-only guards: every restriction re-verified by API (UI hiding is UX, not security).

---

## 6. Demo Mode

`/demo` boots a demo tenant (pre-seeded DB org or `POST /organizations/demo-data`):
- Full navigation, sandbox mutations allowed but flagged "Demo" banner.
- Reset button → reload demo data.
- Uses same components — zero demo-only UI forks.

---

## 7. Quality Gates

- `npm run lint` (ESLint + TS strict), `npm run build` (tsc + vite) must pass in CI.
- Component tests: Vitest + React Testing Library for: auth forms, mapping wizard, message approval buttons, score breakdown.
- Workflow tests: login → dashboard render; import happy path (mocked API).
- Lighthouse targets: Performance ≥ 85 mobile on dashboard, no layout shift on StatCards.
