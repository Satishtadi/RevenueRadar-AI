# RevenueRadar AI

**Find the customers you're losing. Recover them before they're gone.**

AI Revenue Recovery & Customer Intelligence Platform for small and medium service businesses (dental/medical clinics first; configurable for salons, fitness, coaching, real estate, and other lead-driven businesses).

RevenueRadar AI identifies at-risk customers, explains *why* revenue is being lost, ranks recovery opportunities by value, and helps the team take AI-assisted action — with human approval before anything is sent.

---

## Status

**Phase 0 — Architecture complete. Awaiting founder approval before implementation.**

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System, module, AI, security & deployment architecture + trade-off decisions |
| [docs/DATABASE.md](docs/DATABASE.md) | ER diagram, all tables, indexes, migration strategy |
| [docs/API.md](docs/API.md) | Complete REST API specification (v1) |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Routes, folder structure, key screen designs, design system |
| [docs/ROADMAP.md](docs/ROADMAP.md) | 20-phase MVP roadmap with verification gates |

---

## Architecture at a glance

```text
React + TS (Vite) SPA
        ↓ HTTPS
Spring Boot 3 modular monolith (Java 17)
        ↓
PostgreSQL 16 (Flyway migrations)  ·  AIProvider: OpenAI / Gemini / Mock
        ↓
Spring Scheduler (follow-ups, overdue, missed appointments, radar)
```

- **Modular monolith** — package-by-feature; modules are future microservice boundaries.
- **Multi-tenant** — every row scoped by `organization_id`, derived from JWT (never trusted from the client).
- **Deterministic vs AI** — scores, revenue math, rules, permissions = plain Java. AI = understanding, drafting, insights only. AI is abstracted behind `AIProvider`, versioned prompt templates, response validation, and DB-cached results (input hash) to control cost.
- **Honest UI** — "Potential" vs "Verified Recovered" are never conflated; unimplemented features (WhatsApp send, payments) are not faked.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form |
| Backend | Java 17, Spring Boot 3 (Web, Security, Data JPA, Validation, Actuator), Maven |
| Database | PostgreSQL 16, Flyway |
| AI | OpenAI / Gemini (config-switchable), Mock provider for dev/tests |
| Docs | springdoc-openapi (Swagger) |
| Infra | Docker Compose (local), GitHub Actions (CI/CD), EC2 + RDS (prod) |

Redis, WhatsApp, email delivery, and payment gateways are **interfaces first, implementations later** — none are required to run locally.

---

## Repository structure

```text
RRA/
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── FRONTEND.md
│   └── ROADMAP.md
├── backend/                         # Phase 1 starts here
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/java/com/revenueradar/
│       │   ├── shared/              # api, security, exception, audit, ratelimit, config
│       │   ├── identity/            # api, application, domain, infra
│       │   ├── organization/
│       │   ├── billing/
│       │   ├── customer/
│       │   ├── lead/
│       │   ├── conversation/
│       │   ├── followup/
│       │   ├── appointment/
│       │   ├── recovery/            # score engine, radar, sessions
│       │   ├── revenue/
│       │   ├── ai/                  # provider/, prompt/, application/
│       │   ├── importx/
│       │   ├── reporting/
│       │   ├── notification/
│       │   ├── analytics/
│       │   └── admin/
│       ├── main/resources/
│       │   ├── application.yml
│       │   ├── application-local.yml
│       │   ├── db/migration/        # V1__... .sql
│       │   └── prompts/             # lead-analysis-v1.txt, ...
│       └── test/java/               # unit + Testcontainers integration tests
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/  api/  components/  features/  hooks/
│       ├── layouts/  pages/  styles/  types/  utils/
├── docker-compose.yml
├── .env.example                     # placeholders only — never real secrets
└── .gitignore
```

---

## Local setup

> Not runnable yet — available from Phase 1 onward.

```bash
# 1. configure
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, AI keys (or ai.provider=mock)

# 2. start everything
docker compose up

# 3. open
# Frontend: http://localhost:5173
# API:      http://localhost:8080/api/v1
# Swagger:  http://localhost:8080/swagger-ui.html
```

Backend-only: `mvn spring-boot:run -Dspring-boot.run.profiles=local` (needs local Postgres).
Frontend-only: `cd frontend && npm install && npm run dev`.

Full details will be documented in `LOCAL_SETUP.md` during Phase 1.

---

## Environment variables

See `.env.example` (placeholders only):

```text
DATABASE_URL=  DATABASE_USERNAME=  DATABASE_PASSWORD=
JWT_SECRET=
AI_PROVIDER=mock|openai|gemini   OPENAI_API_KEY=  GEMINI_API_KEY=
REDIS_URL=        (optional)
S3_BUCKET=  AWS_REGION=  AWS_ACCESS_KEY=  AWS_SECRET_KEY=
PAYMENT_PROVIDER=  PAYMENT_API_KEY=
```

Real values live in `.env` (git-ignored) or environment/SSM — never in code or the frontend bundle.

---

## Quality rules (non-negotiable)

1. Organization isolation enforced server-side and proven by tests.
2. Controllers thin; services own business logic; DTOs never expose entities.
3. AI only where intelligence is required; every AI result validated and cached.
4. Nothing is "sent", "recovered", or "paid" in the UI unless it actually happened.
5. After every phase: compile → test → fix → verify → document → only then continue.

---

## Roadmap summary

**MVP (Phase 1–20):** auth → org/RBAC → customers → leads → CSV import → follow-ups → scoring → dashboard → AI abstraction → AI analysis → AI messages → recovery session → reports → frontend → tests → Docker → deploy → harden.

**Then:** email/WhatsApp integrations → payments → scheduled AI summaries → multilingual → AI agents → AI Employee platform.
