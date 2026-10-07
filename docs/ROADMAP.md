# RevenueRadar AI — MVP Development Roadmap

Phase order follows spec §101. **Rule (§102): after every phase → compile → test → fix → verify API → update docs → only then continue.** Never assume previous code works.

Each phase below ends with a **Verification** list. A phase is "done" only when its verification passes.

---

## Phase 0 — Architecture ✅ (this document set)

Deliverables:
- `docs/ARCHITECTURE.md` — system, modules, AI, security, deployment
- `docs/DATABASE.md` — ERD, tables, indexes, migrations
- `docs/API.md` — full REST spec
- `docs/FRONTEND.md` — routes, folder structure, screen designs, design system
- `docs/ROADMAP.md` — this file
- `README.md` — repo structure + how docs fit together

**Gate: founder approves architecture before any implementation code.**

---

## Phase 1 — Backend Foundation

Build:
- Maven project (Java 17, Spring Boot 3.x), profiles: `local`, `test`
- Packages per `ARCHITECTURE.md` §4 (empty module skeletons)
- `ApiResponse` / `PagedResponse` / error envelope
- `GlobalExceptionHandler` + exception types (NotFound, Forbidden, Validation, Conflict, RateLimit, AIProvider)
- Structured logging (request ID filter), CORS config, Actuator health
- OpenAPI/springdoc
- Config loading from env (`.env.example`, `application-local.yml`)
- Test harness: JUnit 5 + Mockito + Testcontainers Postgres skeleton

Verify: app starts · `/actuator/health` = UP · `/swagger-ui.html` loads · one green context test · `mvn verify` passes.

---

## Phase 2 — Database + Migrations

Build:
- Flyway `V1–V7` per `DATABASE.md` (schema + seeds: roles, plans, feature flags, default lost reasons, default rules template)
- JPA entities + repositories for `identity` and `organization` modules first
- `updated_at` triggers / `@PreUpdate`

Verify: migrations run clean from zero · re-run = no-op · seed data present · entity mapping tests green.

---

## Phase 3 — Authentication

Build:
- register (org + owner, pending onboarding) · login · refresh (rotation) · logout · me
- BCrypt · JWT access (15m) + refresh (opaque, hashed, 14d, rotation + reuse revoke)
- forgot/reset password (token tables; email via `NoopEmailSender` + logged link in dev)
- rate limiting on `/auth/*`

Verify: full token lifecycle test · expired/invalid token → 401 · reuse of rotated refresh → family revoked · passwords not in logs · rate limit → 429.

---

## Phase 4 — Organization + RBAC

Build:
- org profile CRUD · onboarding wizard API (10 steps, resumable) · business services · settings (scoring weights, thresholds)
- users CRUD (invite/create, role assignment, last-owner protection)
- `OrganizationContext` + `@RequireRole` + method security
- audit log AOP (`USER_LOGIN`, `USER_CREATED`, ...)

Verify: **TenantIsolationTest** (org A → org B resources = 404) · employee blocked from settings (403) · onboarding status resumes · audit rows written.

---

## Phase 5 — Customers

Build:
- customer CRUD + search (`q` on name/phone/email) + filters + pagination
- customer profile aggregates · timeline endpoint (merged events)
- manual revenue record (`ACTUAL` + `verified`)

Verify: pagination correct at >1k rows · cross-tenant 404 · timeline merges in order · soft delete hides everywhere.

---

## Phase 6 — Leads

Build:
- lead CRUD · status transitions (incl. `LOST` requires reason) · assign · next follow-up
- lost-reasons API (system + custom)
- lead detail aggregates (score placeholder, actions, AI placeholder)

Verify: invalid transition → 422 · lost without reason → 422 · employee sees only assigned · filters + composite-index queries exercised by tests.

---

## Phase 7 — CSV Import

Build:
- upload (CSV/XLSX) → headers + sample · mapping API · dry-run validate · batch import (chunks of 500, progress) · error rows + downloadable error report CSV · history
- validation: required fields, phone/email format, duplicates (within file + DB), dates, amounts
- `product_events: LEAD_IMPORTED`

Verify: 5,000-row fixture imports in bounded time with progress · counts accurate · errors downloadable · same file twice → duplicates not double-imported · **zero AI calls during import**.

---

## Phase 8 — Follow-up Engine

Build:
- follow-ups CRUD · complete/skip/cancel (outcome, sets lead `last_contact_at`)
- due/overdue queries · notifications (in-app) on due/overdue
- automation rules CRUD + `RuleEvaluator` (allow-listed fields/operators)
- Spring Scheduler: overdue detection, rule evaluation, missed-appointment detection → recovery action

Verify: rule with conditions creates correct follow-up (unit tests per operator) · overdue job idempotent (no duplicate overdue rows) · missed appointment → `MISSED_APPOINTMENT` recovery action once.

---

## Phase 9 — Recovery Scoring + Radar

Build:
- `RecoveryScoreEngine` (pure Java, weights from settings, sub-scores + factors persisted)
- recompute on events + nightly batch
- `RadarClassifier` (7 categories, idempotent `recovery_actions`)
- recovery endpoints: radar list/summary, scoreboard, action resolve
- revenue endpoints: at-risk / potential / recovered (verified only), leakage %, ROI

Verify: scoring unit tests with fixed fixtures (score must equal documented breakdown) · weights sum validation · radar idempotent across runs · leakage % math test · recovered revenue ignores unverified records.

---

## Phase 10 — Dashboard + Action Plan

Build:
- `GET /revenue/summary`, radar summary, pulse counts, follow-ups due today
- `GET /recovery/action-plan/today` (deterministic, ranked by score × value)
- notifications center endpoints

Verify: response < 500ms with 10k customers fixture (explain/analyze plans checked) · numbers consistent across dashboard/radar/reports.

---

## Phase 11 — AI Provider Abstraction

Build:
- `AIProvider` + DTOs · `OpenAiProvider`, `GeminiProvider`, `MockAiProvider`
- `PromptRegistry` (versioned files) · `AiResponseValidator` · retry-once → fallback policy
- `ai_analyses` persistence with `input_hash` dedupe · usage/cost tracking · `/ai/usage`
- rate limits + plan quota enforcement

Verify: provider switch via config property · mock provider used in tests (no network) · invalid JSON output → fallback, no crash · identical request → second call served from DB (0 API cost) · quota exceeded → 429.

---

## Phase 12 — AI Lead Analysis

Build:
- analysis on lead events (gated) + manual `refresh=true` · store intent/sentiment/likelihood/action/reason
- lead detail AI panel
- deterministic fallback analysis when AI unavailable

Verify: analysis cached · unchanged lead → no new AI row · mock end-to-end test · fallback path test.

---

## Phase 13 — AI Message Generation

Build:
- generate (EN + TE) → `ai_messages` DRAFT · edit · regenerate · approve · copy logging
- message history per lead · `MESSAGE_GENERATED` / `MESSAGE_APPROVED` audit
- plan limit on messages

Verify: TE generation returns non-empty natural text (manual review) · approve transitions state machine · UI/API never expose "send" · quota enforced.

---

## Phase 14 — Recovery Workflow

Build:
- recovery session API (start/next/contacted/skip) · resolution → optional revenue record
- missed-appointment → recovery → contacted loop complete

Verify: session order deterministic (score desc, value desc) · contacted action leaves queue · resolved action appears in recovered stats **only** when linked verified revenue.

---

## Phase 15 — Reports

Build:
- all report endpoints (§12 API) + CSV export · team performance
- period filters + custom range

Verify: totals match raw SQL cross-check · export matches on-screen data · employee-scoped users get filtered report access.

---

## Phase 16 — Frontend (parallel from Phase 3, completed here)

Build in this order:
1. Shell: design tokens, layout (sidebar/topbar/mobile nav), auth pages, axios+query setup
2. Onboarding wizard
3. Dashboard + StatCards + action plan teaser
4. Leads & customers (lists, detail, timeline)
5. Radar + Action Plan + Recovery Session
6. Follow-ups + appointments
7. AI message generator UI (Edit/Regenerate/Copy/Approve)
8. Import wizard
9. Reports + leakage + team
10. Settings + billing + notifications
11. Marketing landing, pricing, calculator, demo mode
12. Responsive pass + empty/loading/error states everywhere

Verify: `lint` + `build` green · all flows in §108 clickable against real backend · mobile breakpoints checked · no secrets in bundle (`grep VITE_`).

---

## Phase 17 — Testing

- Backend: auth, RBAC, **tenant isolation**, lead creation, scoring, follow-up rules, revenue calc, AI abstraction, import validation (target: critical-path coverage, not % vanity)
- Frontend: auth forms, mapping wizard, approval buttons, score breakdown
- Security tests: unauthorized, wrong-org, invalid/expired JWT, malformed input, oversized import, rate limits

Verify: CI runs full suite on push · suite is deterministic (no flaky AI/network).

---

## Phase 18 — Docker

- `backend/Dockerfile` (multi-stage: maven → JRE 17)
- `frontend/Dockerfile` (build → nginx serving SPA + `/api` proxy)
- `docker-compose.yml`: postgres + backend + frontend (`redis` profile optional)
- seed script for local demo

Verify: clean machine → `docker compose up` → register → demo data → dashboard works.

---

## Phase 19 — Deployment

- GitHub Actions: lint → test → build → docker → deploy (staging on `develop`, prod on `main`)
- Prod: Cloudflare → static frontend + EC2 backend + RDS; secrets via env/SSM
- Flyway on deploy · `/actuator/health` monitoring · log delivery

Verify: staging deploy from a merge · rollback procedure documented · prod smoke test (register → import → radar).

---

## Phase 20 — Production Hardening

- Rate limits tuned · security headers · backup + restore drill · error tracking · AI cost dashboard · load check (100 orgs × 10k customers modelled) · README/LOCAL_SETUP/DEPLOYMENT/SECURITY docs finalized · privacy (PII masking in logs, export/delete architecture)

Verify: §106 quality checklist fully checked → **declare MVP complete**.

---

## Post-MVP (Phase 2+ — do not start earlier)

1. Email sending (`EmailSender` real impl) · WhatsApp/WhatsApp Cloud API via `MessagingProvider` → replace Copy with Send
2. Razorpay/Stripe via `PaymentProvider` · subscription self-serve
3. Auto-scheduled AI daily summary · multilingual UI (TE/HI/TA/KN)
4. Redis: cache + distributed rate limits · report pre-aggregation
5. AI follow-up agent → Phase 3–5 roadmap (sales/support/appointments agents → AI Employee platform)

---

## Git Strategy

```text
main  ·  develop  ·  feature/*  ·  bugfix/*
```
Conventional commits: `feat: add recovery scoring engine`, `fix: prevent cross-tenant lead access`.
Commit at every verification gate (§102), not just phase end.
