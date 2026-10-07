# RevenueRadar AI — System Architecture

Status: Phase 0 (Planning) — awaiting approval before implementation.

---

## 1. Guiding Constraints

These constraints drive every architectural decision below:

| Constraint | Decision |
|---|---|
| Solo developer, limited budget | Modular monolith, one backend, one frontend |
| Small service businesses (10k customers/org) | Monolith + PostgreSQL is sufficient; no microservices |
| AI cost control | AI only where intelligence is required; deterministic code everywhere else |
| Multi-tenant SaaS | `organization_id` on every tenant-owned row + enforcement in service layer |
| Must evolve toward AI Employee platform | Module boundaries = future service boundaries |
| Data must never mix between tenants | Organization context derived from JWT, never from request body |

**Explicitly excluded from MVP:** Kubernetes, Kafka, microservices, Redis (optional), mobile apps, custom LLM training, WhatsApp auto-send, real payment verification.

---

## 2. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│   Browser (Desktop / Laptop / Tablet / Mobile browser)          │
│   Marketing site (static)  +  App SPA (authenticated)           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
                    ┌──────────▼──────────┐
                    │  CDN (Cloudflare)   │  ← static React build
                    └──────────┬──────────┘
                               │ /api/v1/*
                    ┌──────────▼──────────────────────────────┐
                    │     SPRING BOOT MODULAR MONOLITH        │
                    │                                         │
                    │  REST Controllers  (thin)               │
                    │        ↓                                │
                    │  Application Services                   │
                    │        ↓                                │
                    │  Domain Logic (scoring, rules, revenue) │
                    │        ↓                                │
                    │  Repositories (Spring Data JPA)         │
                    │        ↓                                │
                    │  Cross-cutting: Security, Audit,        │
                    │  Validation, Error Handling, Rate Limit │
                    └───┬──────────────┬──────────────┬───────┘
                        │              │              │
              ┌─────────▼───┐   ┌──────▼──────┐  ┌────▼─────────┐
              │ PostgreSQL  │   │ AI Provider │  │  Scheduler   │
              │ (RDS prod)  │   │ OpenAI /    │  │  (@Scheduled)│
              │             │   │ Gemini /    │  │  follow-ups, │
              │ Flyway      │   │ Mock        │  │  overdue,    │
              │ migrations  │   │ (abstraction)│  │  missed appts│
              └─────────────┘   └─────────────┘  └──────────────┘

              OPTIONAL (post-MVP): Redis (cache/rate-limit),
                                   S3 (imports/reports), SMTP/WhatsApp
```

**Runtime units in MVP:** exactly two deployables (backend JAR, frontend static files) plus PostgreSQL.

---

## 3. Technology Decisions

### Backend
| Concern | Choice | Notes |
|---|---|---|
| Language/Runtime | Java 17 | LTS |
| Framework | Spring Boot 3.x | Web, Security, Data JPA, Validation, Actuator |
| ORM | Hibernate (via Spring Data JPA) | |
| DB | PostgreSQL 16 | Relational is mandatory for this domain |
| Migrations | **Flyway** | Versioned SQL in `db/migration`, runs on startup |
| Build | Maven | Single module for MVP |
| API docs | springdoc-openapi (Swagger UI) | `/swagger-ui.html` |
| Scheduling | Spring `@Scheduled` | No Kafka in MVP |
| CSV | Apache Commons CSV | Streaming + batch inserts |
| Tests | JUnit 5, Mockito, Testcontainers (Postgres) | |

### Frontend
| Concern | Choice | Notes |
|---|---|---|
| Framework | React 18 + TypeScript | |
| Build | Vite | |
| Routing | React Router v6 | |
| Server state | TanStack Query (React Query) | Caching, refetch, optimistic updates |
| HTTP | Axios | Single client with auth interceptor |
| Forms | React Hook Form + Zod | Validation |
| Styling | Plain CSS with design tokens (CSS variables) | No heavy UI framework; keeps bundle small and design controllable |
| Charts | Recharts | Only where truly needed |

**Rejected for MVP:** Redux (TanStack Query covers server state), Tailwind/UI kit dependency churn, Next.js (SSR not needed for an authenticated dashboard).

### Optional
Redis is **not** required to run locally. It is a configuration option (`REDIS_URL` empty = disabled) reserved for caching, rate-limit counters, and scheduler coordination later.

---

## 4. Module Architecture (Modular Monolith)

Package-by-feature. Each module is a vertical slice and a candidate for future extraction into a service.

```text
com.revenueradar
│
├── shared                    # cross-cutting (NOT a business module)
│   ├── api                   # ApiResponse, PagedResponse, error bodies
│   ├── security              # JWT, filters, OrganizationContext, @RequireRole
│   ├── exception             # GlobalExceptionHandler, business exceptions
│   ├── audit                 # AuditLog writer (AOP)
│   ├── ratelimit             # in-memory limiter (Redis-backed later)
│   ├── validation            # shared validators
│   └── config                # SecurityConfig, OpenApiConfig, CorsConfig
│
├── identity                  # auth, users, roles, refresh tokens
├── organization              # orgs, settings, services, onboarding, plans
├── billing                   # subscriptions, usage limits, payment abstraction
├── customer                  # customers, timeline, global search
├── lead                      # leads, statuses, lost reasons, assignment
├── conversation              # conversations + messages
├── followup                  # follow-up tasks + rule engine
├── appointment               # appointments + missed detection
├── recovery                  # recovery score engine, radar, recovery actions
├── revenue                   # revenue records, leakage analytics, ROI
├── ai                        # AIProvider abstraction, prompts, analyses, messages
├── importx                   # CSV import jobs, mapping, validation
├── reporting                 # report queries (lead/conversion/team/...)
├── notification              # in-app notifications
├── analytics                 # product usage events, success metrics
└── admin                     # platform admin endpoints (super admin only)
```

### Internal module contract rules

1. A module exposes **application services + DTOs**, never JPA entities, to other modules.
2. Modules communicate via service interfaces in MVP (same JVM). No shared tables across modules except through documented foreign keys.
3. Controllers depend only on application services. Services contain business logic. Repositories are reached only from services.
4. `shared` must never contain business rules.
5. Cross-module writes that must be atomic (e.g., lead → lost → revenue record) happen inside one service method with one transaction, calling module services.

### Layering inside a module

```text
lead/
 ├── api/            LeadController            (thin: validate, call service, map DTO)
 ├── application/    LeadService, commands/queries
 ├── domain/         Lead, LeadStatus, LostReason, scoring inputs, domain events
 └── infra/          LeadRepository, LeadEntity, LeadMapper
```

Entities live in `infra` (or `domain.persistence`) and are package-private to the module where practical.

---

## 5. Request Lifecycle & Tenant Isolation

```text
HTTP Request
  → JwtAuthFilter: validate access token → SecurityContext
      claims: sub(userId), org(organizationId), roles[], plan
  → OrganizationContext (request-scoped): organizationId, userId, roles
  → RateLimitFilter (login/register/AI/import endpoints)
  → Controller: @Valid DTO
  → Service:
      • orgId = OrganizationContext.get()          ← NEVER from request body
      • @RequireRole(OWNER, MANAGER)
      • repository.findAll(organizationId, filters)  ← every query scoped
  → AuditLog (AOP on mutating operations)
  → ApiResponse envelope
```

**Hard rule:** DTOs may contain an `organizationId` field for display purposes, but it is ignored on write. The server always takes the org from the authenticated principal. This is enforced by convention + tests (`TenantIsolationTest`).

### Role model (MVP)

```text
SUPER_ADMIN  → platform user, organizationId = NULL (platform tenant)
OWNER        → full org scope
MANAGER      → leads, assignments, follow-ups, reports, team analytics
EMPLOYEE     → own assigned leads, follow-up completion, AI suggestions
```

RBAC is enforced with `@PreAuthorize` / a custom `@RequireRole` annotation + a single authorization service. **Decision:** full `permissions`/`role_permissions` tables are deferred (Phase 2) — a role enum covers MVP without over-engineering. Documented as a deliberate postponement.

---

## 6. AI Architecture

### 6.1 Abstraction

```java
public interface AIProvider {
    LeadAnalysis analyzeLead(LeadAnalysisRequest request);
    RecoveryRecommendation recommendRecovery(RecoveryRequest request);
    GeneratedMessage generateMessage(MessageGenerationRequest request);
    ConversationSummary summarizeConversation(ConversationRequest request);
    BusinessInsights generateBusinessInsights(BusinessInsightRequest request);
}
```

Implementations (Spring `@ConditionalOnProperty ai.provider`):

| Provider | Class | Purpose |
|---|---|---|
| `openai` | `OpenAiProvider` | Production |
| `gemini` | `GeminiProvider` | Production |
| `mock` | `MockAiProvider` | Local dev + tests **without spending money** |

Switching = `ai.provider=gemini` in config. API keys never leave the backend.

### 6.2 AI package structure

```text
ai/
 ├── api/            AiController
 ├── application/    AiAnalysisService, MessageGenerationService
 ├── domain/         LeadAnalysis, GeneratedMessage, AiAnalysisRecord
 ├── provider/       AIProvider, OpenAiProvider, GeminiProvider, MockAiProvider
 │                   AiResponseValidator, AiProviderException
 ├── prompt/         PromptRegistry, prompts/lead-analysis-v1.txt ...
 └── infra/          AiAnalysisRepository (caching/persistence)
```

### 6.3 Cost-control design

1. **Prompt templates** live in `resources/prompts/*.txt` with versioned names (`lead-analysis-v1`). No prompts scattered in Java strings.
2. **Result caching:** every AI call computes `input_hash = sha256(normalized request)`. Table `ai_analyses` has unique `(organization_id, entity_type, entity_id, analysis_type, input_hash)`. Unchanged data → cached result, **zero API cost**.
3. **Gating:** analysis runs only on meaningful events (lead created, status change, new conversation, manual trigger) and at most once per entity per N hours (configurable).
4. **Structured output:** model forced to JSON via response format; output parsed with Jackson into a typed record, then validated (`AiResponseValidator`: enum values, score bounds 0–100, non-blank fields).
5. **Failure policy:** invalid output → one retry with the error appended → fallback to deterministic heuristic → log `AI_OUTPUT_INVALID` → never crash, never return garbage to the UI.
6. **Token-conscious:** messages truncated to configurable char limits; only last N conversation turns sent.

### 6.4 Deterministic vs AI (mandatory split)

| Deterministic Java (no AI) | AI |
|---|---|
| Dates, deadlines, overdue detection | Conversation intent/sentiment |
| Recovery score math (transparent weights) | Lead analysis & conversion likelihood |
| Revenue totals, ROI, leakage percentages | Recommendation reasoning |
| Status transitions, permissions, auth | Follow-up message drafts (EN/TE) |
| CSV validation, dedupe, import | Conversation summaries |
| Follow-up rule evaluation | Daily summary & business insights |
| Subscription limits, usage counting | |

### 6.5 Human approval flow (MVP — no auto-send)

```text
Generate → stored as DRAFT → [Edit] [Regenerate] [Copy] [Approve & Send]
                                              │
                                    APPROVED → (send capability = Phase 2,
                                                MVP shows Copy only)
```

`MessagingProvider` interface (`sendMessage`, `getStatus`) is declared in MVP with no production implementation; UI honesty rule: if not implemented, the button says **Copy Message**, never "Send WhatsApp".

### 6.6 AI safety

- System prompt forbids: financial promises, inventing customer facts, claiming payments occurred, cross-tenant data, sensitive actions.
- Every generation is logged in `audit_logs` with `MESSAGE_GENERATED`.
- Output filtered for other organizations' identifiers (defense in depth).

---

## 7. Core Domain Engines (plain Java, testable)

### 7.1 Recovery Score Engine (`recovery` module)

Pure function: `ScoreInput → ScoreResult`. No AI, no DB inside.

```text
Intent score        25   (status, asked price, service interest)
Engagement score    20   (interactions, response behavior)
Value score         15   (estimated value vs org average)
Recency score       15   (last interaction vs now)
Follow-up risk      15   (overdue days, never contacted)
Appointment signal  10   (booked/completed/missed)
────────────────────────
Total              100
```

- Weights configurable per organization in `business_settings.scoring_weights` (fallback = defaults above). Weights must always sum to 100 (validated on save).
- Sub-scores persisted in `recovery_scores` → UI can show **why** a lead scored 94, per spec transparency requirement.
- Recomputed: on lead/conversation/follow-up events + nightly batch.

### 7.2 Revenue Radar (`recovery` module)

Rule-based classifier — deterministic, scheduled hourly + on-event:

| Category | Rule (example) |
|---|---|
| HIGH_PRIORITY | intent ≥ threshold AND not contacted > X h |
| FOLLOWUP_OVERDUE | `next_follow_up_at < now()` AND status not terminal |
| SILENT_CUSTOMER | last_interaction_at > org silent-days AND had ≥1 interaction |
| MISSED_APPOINTMENT | appointment.status = MISSED AND no recovery action |
| HIGH_VALUE_CUSTOMER | estimated_value ≥ org high-value threshold |
| LOST_CUSTOMER | lead.status = LOST |
| RECOVERY_OPPORTUNITY | recovery_score ≥ threshold AND status ∈ recoverable |

Emits rows into `recovery_actions` (idempotent: unique open action per `(org, lead, category)`).

### 7.3 Follow-up Rule Engine (`followup` module)

Table-driven, JSON rules — **not** Drools:

```json
{
  "name": "High intent, no response 24h",
  "enabled": true,
  "conditions": [
    { "field": "intent",        "op": "GTE", "value": "HIGH" },
    { "field": "hoursSinceContact", "op": "GT", "value": 24 }
  ],
  "action": { "type": "CREATE_FOLLOWUP", "priority": "HIGH", "dueInHours": 4 }
}
```

- Operators: `EQ, NEQ, GT, GTE, LT, LTE, IN, BETWEEN, IS_NULL`.
- Fields: small allow-listed set (never arbitrary code/SpEL — security).
- Stored in `automation_rules` (seeded with sensible defaults, org-editable).
- Evaluated by `RuleEvaluator` on schedule + events. Adding a rule later = data, not code.

### 7.4 Revenue calculation (`revenue` module)

Three distinct types, never conflated:

```text
POTENTIAL   — value of open high-priority / recovery opportunities
ESTIMATED   — expected value weighted by conversion likelihood
ACTUAL      — verified money in (requires verified=true + source)
```

Recovered Revenue / ROI render **only** from `ACTUAL + verified` records. UI shows Potential/Estimated in muted styling with labels — honesty rule from spec §30, §109.

---

## 8. Security Architecture

```text
                    ┌──────────────────────────────┐
                    │         SecurityConfig        │
                    │  stateless session, CSRF off  │
                    │  (JWT), CORS allow-list,       │
                    │  headers, method security ON  │
                    └──────────────┬───────────────┘
                                   │
   Request ──► JwtAuthFilter ──► SecurityContext(sub, org, roles, plan)
                                   │
                    ┌──────────────▼───────────────┐
                    │  AuthorizationService         │
                    │  • role check  @RequireRole   │
                    │  • org check   row.organizationId == ctx.org
                    │  • plan/usage  billing guard  │
                    └──────────────────────────────┘
```

| Area | Implementation |
|---|---|
| Passwords | BCrypt (strength 12); never logged, never returned |
| Access token | JWT HS256, 15 min, claims: `sub, org, roles, plan` |
| Refresh token | Opaque 256-bit random, **stored hashed** in `refresh_tokens`, 14-day TTL, rotation on use, reuse-detection revokes family |
| Logout | Refresh token deleted; access token expires naturally (short TTL) |
| Password reset | `forgot-password` → single-use hashed token table → `reset-password` (email delivery stubbed in MVP) |
| Email verification | Architecture + token tables present; sending is pluggable (`EmailSender` interface, `NoopEmailSender` default) |
| Tenant isolation | Org from JWT only; repository methods require `organizationId` param; dedicated cross-tenant tests |
| Input validation | Bean Validation on every DTO; parameterized JPA (no string SQL); size limits on imports |
| Rate limiting | In-memory token bucket on `/auth/*`, `/ai/*`, `/import/*` (per IP + per org); swap to Redis counters later |
| Secrets | Environment variables only; `.env.example` committed, `.env` git-ignored |
| Logs | Structured (requestId, userId, orgId, op, duration). Never: passwords, tokens, API keys, full conversations, raw phone numbers (masked) |
| Headers | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP (SPA) |
| Audit | AOP `@Audited` on mutating services → `audit_logs` |

**Admin data rule:** `/api/v1/admin/*` returns org counts, usage, health, billing status — never customer/lead PII.

---

## 9. Deployment Architecture

### 9.1 Local development (Docker)

```yaml
# docker-compose.yml
services:
  postgres:   # 16, volume, healthcheck
  backend:    # Spring Boot, dev profile, Flyway on boot
  frontend:   # Vite dev server
  # redis:    # profile: cache (optional, off by default)
```

Fallback (no Docker for DB): run local Postgres, `application-local.yml`.

### 9.2 Production (MVP)

```text
User → Cloudflare (DNS, CDN, WAF, rate limit edge)
         ├─ /          → static React build (S3 + CloudFront, or CF Pages)
         └─ /api/v1/*  → EC2 (Spring Boot, systemd or Docker)
                           ├─ RDS PostgreSQL (Multi-AZ later, automated backups)
                           ├─ S3 (CSV error reports, exports)
                           └─ Secrets → environment / SSM Parameter Store
```

Scale-out path when needed: ALB → N backend instances (stateless JWT makes this trivial) → RDS read replica → ElastiCache.

**EKS/Kafka explicitly deferred** until traffic proves the need.

### 9.3 CI/CD (GitHub Actions)

```text
push → lint + unit tests (backend, frontend)
     → integration tests (Testcontainers Postgres)
     → mvn package + vite build
     → docker build
     → deploy (main → production; develop → staging)
```

Environments: `local`, `dev`, `staging`, `prod` via Spring profiles (`application-{profile}.yml`).

### 9.4 Observability (MVP-level)

- `/actuator/health` (+ DB, Flyway, disk indicators)
- Structured JSON logs with request IDs
- `error` tracking hook (placeholder for Sentry later)
- `ai_usage` metrics per org (cost estimate)

---

## 10. Key Architectural Trade-offs (co-founder notes)

Postponed **deliberately** (with rationale), not forgotten:

| Item | MVP | Why |
|---|---|---|
| `permissions` tables | Role enum + annotations | 4 roles; tables add CRUD with no MVP value |
| Custom lead statuses per org | Fixed enum (10 statuses) | Spec itself says "later" (§17) |
| Redis | Disabled by default | Nothing needs it yet; interface-shaped config keeps swap easy |
| WhatsApp/Email sending | `MessagingProvider` interface + Copy button | UI must not claim unimplemented features (§109) |
| Payment gateway | `PaymentProvider` interface + plan/limit enforcement backend-side | Razorpay/Stripe in Phase 2 |
| Automatic AI daily summary | On-demand generation | Scheduling infrastructure already exists; cron later |
| Drools-style rule engine | JSON rules + allow-listed evaluator | Same capability, 5% of the complexity |
| Refresh token reuse families | Basic rotation + revoke | Full family tracking if abused later |
| i18n framework | i18n-ready structure (no hard-coded strings in components) | English only in MVP |
| Data export/delete | Interface + admin-triggered JSON export | Required for privacy story; bulk tooling Phase 2 |

### Risks identified before coding

1. **AI cost runaway on import** — importing 5,000 leads must NOT trigger 5,000 AI calls. Rule: AI analysis on import is *sampled/batched* (top N by score) and deferred to a background queue; deterministic scoring covers all rows instantly. The deterministic Recovery Score gives value even with zero AI calls.
2. **Scoring must not require AI** — satisfied: scoring is pure Java (§7.1).
3. **Super-admin vs tenant model** — solved with `organization_id NULL` platform users + admin DTOs that whitelist non-PII fields.
4. **Report query performance at 10k customers/org** — all lists paginated; reports aggregate with indexed `(organization_id, ...)` composite indexes; heavy reports can be pre-aggregated later.
5. **Flyway + iterative schema** — forward-only migrations, no destructive edits after any environment runs them.

---

## 11. What "done" looks like for Phase 0

- [x] System architecture
- [x] Module architecture
- [x] AI architecture
- [x] Security architecture
- [x] Deployment architecture
- [ ] Database ERD + tables → `DATABASE.md`
- [ ] REST API spec → `API.md`
- [ ] Frontend structure → `FRONTEND.md`
- [ ] Roadmap → `ROADMAP.md`

**Next step:** approval of this document, then Phase 1 (backend foundation).
