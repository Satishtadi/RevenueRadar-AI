# RevenueRadar AI — REST API Specification (v1)

Base path: `/api/v1` · Content type: `application/json` · Auth: `Authorization: Bearer <accessToken>`
OpenAPI/Springdoc: `/swagger-ui.html` (dev/staging only; disabled or secured in prod).

---

## 1. Conventions

### Response envelope

Success:
```json
{ "success": true, "data": {}, "message": "Lead created successfully", "timestamp": "2026-10-06T09:30:00Z" }
```

Error:
```json
{ "success": false, "errorCode": "LEAD_NOT_FOUND", "message": "Lead not found", "timestamp": "..." }
```

Validation error (400): `errorCode: VALIDATION_ERROR`, plus `errors: [{field, message}]`.

### Pagination (all list endpoints)

Request: `?page=0&size=20&sort=createdAt,desc` + resource-specific filters.
Response `data`:
```json
{ "content": [], "page": 0, "size": 20, "totalElements": 0, "totalPages": 0 }
```

### Status codes

| Code | Meaning |
|---|---|
| 200/201/204 | OK / created / no content |
| 400 | validation / malformed |
| 401 | missing/invalid/expired token |
| 403 | role not permitted |
| 404 | not found **or not in your organization** (no existence leak) |
| 409 | duplicate / state conflict |
| 422 | business-rule rejection (e.g., invalid status transition) |
| 429 | rate limited (`Retry-After`) |
| 500 | internal (generic message, no stack trace) |

### Authorization legend

`PUBLIC` · `ANY_AUTH` · `OWNER` · `OWNER+MANAGER` · `OWNER+MANAGER+EMPLOYEE` · `SUPER_ADMIN`

---

## 2. Auth — `/api/v1/auth`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/register` | PUBLIC | `{email,password,fullName,orgName}` → creates pending org + owner; returns tokens |
| POST | `/login` | PUBLIC | Rate limit 5/min/IP → `{accessToken, refreshToken, user, organization}` |
| POST | `/refresh` | PUBLIC | `{refreshToken}` → rotated pair (old token invalidated) |
| POST | `/logout` | ANY_AUTH | revokes refresh token |
| POST | `/forgot-password` | PUBLIC | always 200 (no user enumeration); writes reset token |
| POST | `/reset-password` | PUBLIC | `{token,newPassword}` |
| GET | `/me` | ANY_AUTH | user + roles + org summary + plan + usage |
| POST | `/verify-email` | PUBLIC | `{token}` |

`user`: `{id, fullName, email, roles[], organizationId}`

---

## 3. Organizations & Onboarding — `/api/v1/organizations`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/me` | ANY_AUTH | full org profile (settings, working hours, sources) |
| PATCH | `/me` | OWNER | partial update |
| POST | `/onboarding` | OWNER | one-shot wizard submit (steps 1–10), sets `onboarded_at` |
| GET | `/onboarding/status` | ANY_AUTH | current step for resume |
| GET/POST/PUT/DELETE | `/services` | OWNER | business services CRUD |
| GET/PUT | `/settings` | OWNER | scoring weights (sum=100), radar thresholds, tone, languages |
| POST | `/demo-data` | OWNER | **Load Demo Data** — 50 customers, 75 leads, follow-ups, appointments, lost/recovery, revenue (idempotent per org, `DELETE /demo-data` to remove) |

---

## 4. Users & Roles — `/api/v1/users`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?q=&role=&page=` | OWNER | list org users |
| POST | `/` | OWNER | invite/create user `{email, fullName, role}` — respects plan `users` limit |
| PATCH | `/{id}` | OWNER | update role/status |
| DELETE | `/{id}` | OWNER | deactivate (cannot remove last OWNER) |
| GET | `/{id}/performance` | OWNER+MANAGER | team-performance row |

Roles: `OWNER`, `MANAGER`, `EMPLOYEE` (org scope). `SUPER_ADMIN` only via platform admin API.

---

## 5. Customers — `/api/v1/customers`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?q=&source=&tag=&page=` | OWNER+MANAGER+EMPLOYEE | `q` searches name/phone/email |
| POST | `/` | OWNER+MANAGER | |
| GET | `/{id}` | OWNER+MANAGER+EMPLOYEE | profile incl. totals + AI score summary |
| PUT | `/{id}` | OWNER+MANAGER | |
| DELETE | `/{id}` | OWNER | soft delete |
| GET | `/{id}/timeline` | OWNER+MANAGER+EMPLOYEE | merged chronological events (leads, messages, follow-ups, appointments, AI, revenue) — paged |
| GET | `/{id}/leads` · `/{id}/conversations` · `/{id}/appointments` · `/{id}/revenue` | OWNER+MANAGER+EMPLOYEE | paged sub-resources |
| POST | `/{id}/revenue` | OWNER | record `ACTUAL` revenue `{amount, verified, notes}` |

---

## 6. Leads — `/api/v1/leads`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?q=&status=&priority=&assignedUserId=&service=&source=&minValue=&maxValue=&scoreMin=&createdFrom=&createdTo=&page=` | OWNER+MANAGER+EMPLOYEE | employees see only assigned |
| POST | `/` | OWNER+MANAGER | |
| GET | `/{id}` | OWNER+MANAGER+EMPLOYEE | + current recovery score, open recovery actions, AI analysis |
| PUT | `/{id}` | OWNER+MANAGER | |
| PATCH | `/{id}/status` | OWNER+MANAGER+EMPLOYEE | `{status, lostReasonCode?, notes?}`; `LOST` requires valid reason → 422 otherwise |
| PATCH | `/{id}/assign` | OWNER+MANAGER | `{assignedUserId}` |
| PATCH | `/{id}/follow-up` | OWNER+MANAGER+EMPLOYEE | `{nextFollowUpAt}` |
| GET | `/{id}/score` | OWNER+MANAGER+EMPLOYEE | sub-scores + factors + weights version |
| POST | `/{id}/score/recompute` | OWNER+MANAGER | |
| GET | `/{id}/ai-analysis` | OWNER+MANAGER+EMPLOYEE | latest cached analysis (`refresh=true` forces AI call, rate-limited) |
| GET | `/{id}/lost-reasons` | OWNER+MANAGER | system + custom reasons |

Statuses: `NEW, CONTACTED, QUALIFIED, INTERESTED, APPOINTMENT_BOOKED, APPOINTMENT_COMPLETED, NEGOTIATION, CONVERTED, LOST, RECOVERY`.

---

## 7. Conversations — `/api/v1/conversations`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?customerId=&leadId=&channel=&page=` | OWNER+MANAGER+EMPLOYEE | |
| POST | `/` | OWNER+MANAGER+EMPLOYEE | manual entry `{customerId, leadId?, channel, messages[]}` (MVP source) |
| GET | `/{id}` | OWNER+MANAGER+EMPLOYEE | + messages |
| POST | `/{id}/messages` | OWNER+MANAGER+EMPLOYEE | append message |
| POST | `/{id}/summarize` | OWNER+MANAGER | AI summary (cached) |

---

## 8. Follow-ups — `/api/v1/followups`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?status=&due=&assignedUserId=&priority=&page=` | OWNER+MANAGER+EMPLOYEE | `due=today\|overdue\|week` |
| POST | `/` | OWNER+MANAGER+EMPLOYEE | |
| PATCH | `/{id}/complete` | OWNER+MANAGER+EMPLOYEE | `{outcome, notes?}` → sets lead `last_contact_at` |
| PATCH | `/{id}/skip\|/cancel` | OWNER+MANAGER+EMPLOYEE | |
| PUT | `/{id}` | OWNER+MANAGER | reschedule/reassign |
| GET | `/rules` | OWNER+MANAGER | automation rules list |
| POST | `/rules` · PUT `/{id}` · PATCH `/{id}/toggle` | OWNER | JSON condition editor support |

---

## 9. Appointments — `/api/v1/appointments`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/?status=&from=&to=&assignedUserId=` | OWNER+MANAGER+EMPLOYEE | |
| POST | `/` | OWNER+MANAGER+EMPLOYEE | |
| PATCH | `/{id}/status` | OWNER+MANAGER+EMPLOYEE | → `MISSED` auto-creates recovery action (system-side) |
| PUT | `/{id}` · DELETE | OWNER+MANAGER | |

---

## 10. Recovery — `/api/v1/recovery`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/radar?category=&scoreMin=&page=` | OWNER+MANAGER+EMPLOYEE | Revenue Radar list (grouped counts + rows) |
| GET | `/radar/summary` | OWNER+MANAGER+EMPLOYEE | counts + potential value per category |
| GET | `/actions?status=&category=` | OWNER+MANAGER+EMPLOYEE | |
| PATCH | `/{actionId}/resolve` | OWNER+MANAGER+EMPLOYEE | `{resolution, revenueRecordId?}` |
| GET | `/scoreboard?sort=score` | OWNER+MANAGER | top opportunities by recovery score |
| POST | `/session/start` | OWNER+MANAGER+EMPLOYEE | **Recovery Session** → ordered queue of open actions |
| GET | `/session/{sessionId}/next` | OWNER+MANAGER+EMPLOYEE | next customer + reason + recommendation |
| POST | `/{actionId}/contacted` | OWNER+MANAGER+EMPLOYEE | marks contacted, advances session |
| POST | `/{actionId}/skip` | OWNER+MANAGER+EMPLOYEE | |

---

## 11. Revenue — `/api/v1/revenue`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/summary?period=30d` | OWNER+MANAGER | `{atRisk, potential, estimated, recovered(verified only), roi}` |
| GET | `/leakage?from=&to=&employeeId=&service=&source=` | OWNER | lost-reason distribution % + value |
| GET | `/?type=&from=&to=&page=` | OWNER+MANAGER | records list |
| POST | `/records` | OWNER | manual POTENTIAL/ESTIMATED/ACTUAL entry |
| GET | `/roi` | OWNER | `{subscriptionCost, potential, recovered, roiMultiple}` — recovered only from `verified ACTUAL` |

---

## 12. Reports — `/api/v1/reports`

All: `?period=today|7d|30d|90d|custom&from=&to=` · Auth `OWNER+MANAGER` (employee report: `OWNER+MANAGER`).

| Path | Content |
|---|---|
| `/leads` | created, by status, by source, avg cycle time |
| `/conversion` | stage-to-stage conversion %, drop-off stage |
| `/revenue` | potential vs estimated vs actual over time |
| `/recovery` | opportunities opened, resolved, recovered value, recovery rate |
| `/team-performance` | per employee: leads, contacted, follow-ups, conversions, lost, recovery actions, revenue |
| `/lost-customers` | lost reason distribution (count + value), filters |
| `/followups` | due, completed on time, overdue, avg completion delay |
| `/{name}/export` | CSV download (streamed) |

---

## 13. AI — `/api/v1/ai`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/analyze/lead/{leadId}` | OWNER+MANAGER | cached; `?refresh=true` → billable, rate-limited (20/min/org) |
| POST | `/messages/generate` | OWNER+MANAGER+EMPLOYEE | `{leadId, channel, language: EN\|TE, reason, tone?}` → creates `ai_messages` DRAFT |
| POST | `/messages/{id}/regenerate` | OWNER+MANAGER+EMPLOYEE | keeps history in `original_content` |
| PATCH | `/messages/{id}` | OWNER+MANAGER+EMPLOYEE | edit draft |
| POST | `/messages/{id}/approve` | OWNER+MANAGER | status → APPROVED (send = Phase 2; MVP exposes Copy) |
| GET | `/messages?leadId=&status=` | OWNER+MANAGER+EMPLOYEE | |
| POST | `/insights/business` | OWNER | AI Business Insights (30-day analysis, cached 24h) |
| POST | `/summary/daily` | OWNER+MANAGER+EMPLOYEE | on-demand daily summary |
| GET | `/usage` | OWNER | org AI calls, tokens, cost estimate this period |

Billable endpoints are rate-limited per org and checked against plan limits → `429 AI_LIMIT_REACHED`.

---

## 14. Action Plan — `/api/v1/recovery/action-plan`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/today` | OWNER+MANAGER+EMPLOYEE | `{date, actionCount, items:[{leadId, customerName, type, recoveryScore, potentialValue, reason}]}` — deterministic, no AI call |

Frontend renders **Today's AI Action Plan** from this (label "AI" refers to AI-driven prioritization; numbers are computed deterministically).

---

## 15. Import — `/api/v1/import`

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/upload` | OWNER+MANAGER | multipart CSV/XLSX → `{importJobId, headers[], sampleRows[]}` |
| GET | `/{jobId}` | OWNER+MANAGER | status/progress + counts |
| POST | `/{jobId}/mapping` | OWNER+MANAGER | `{mapping:{csvColumn:systemField}}` → starts import |
| POST | `/{jobId}/validate` | OWNER+MANAGER | dry-run: counts of valid/duplicate/invalid without writing |
| GET | `/{jobId}/errors` | OWNER+MANAGER | error report CSV download |
| GET | `/history` | OWNER | past jobs |

System fields: `name, phone, email, location, source, service, status, estimatedValue, lastContactAt, nextFollowUpAt, assignedUserEmail, notes`.
Required: `name` + (`phone` or `email`). Import = batch inserts (chunks of 500) + progress in `import_jobs`.
**AI note:** import does NOT trigger per-row AI calls; deterministic scoring only.

---

## 16. Notifications — `/api/v1/notifications`

| Method | Path | Auth |
|---|---|---|
| GET | `/?unread=true&page=` | ANY_AUTH |
| POST | `/{id}/read` · POST | ANY_AUTH (`/read-all`) |
| GET | `/preferences` · PUT | ANY_AUTH (MVP: in-app only toggles) |

---

## 17. Settings — `/api/v1/settings`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/business-types` | PUBLIC | catalog (dental, salon, ...) |
| GET | `/lead-sources` | ANY_AUTH | defaults + org custom |
| GET/PUT | `/lost-reasons` | OWNER | add custom reasons |
| GET/PUT | `/features` | OWNER | org feature-flag overrides (subset) |
| GET | `/plans` | PUBLIC | pricing from DB (never hard-coded in frontend) |

---

## 18. Admin (platform) — `/api/v1/admin` (SUPER_ADMIN only)

`GET /overview` · `GET /organizations?status=` · `GET /organizations/{id}` · `PATCH /organizations/{id}/status` ·
`GET /users` · `GET /ai-usage` · `GET /ai-cost` · `GET /system-health` · `GET /subscriptions` ·
`GET/PUT /feature-flags` · `GET/PUT /plans`

Admin DTOs whitelist non-PII fields: counts, status, usage, plan, health — **never customer/lead contents**.

---

## 19. Health / meta

| Path | Auth | Notes |
|---|---|---|
| `/actuator/health` | PUBLIC | DB, disk, Flyway |
| `/api/v1/meta/version` | PUBLIC | build version, env |

---

## 20. Rate limits (MVP, in-memory)

| Endpoint group | Limit |
|---|---|
| `/auth/login` | 5/min/IP |
| `/auth/register` | 3/hour/IP |
| `/ai/*` billable | 20/min/org + plan quota |
| `/import/upload` | 10/hour/org |
| general write | 120/min/org (safety net) |

Headers: `X-RateLimit-Remaining`, `Retry-After` on 429.
