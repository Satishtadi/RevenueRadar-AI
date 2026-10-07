package com.revenueradar.revenue;

/**
 * Module: revenue
 *
 * Revenue records, leakage analytics, ROI (Phase 9).
 *
 * Layout (package-by-feature — a future microservice boundary):
 *   api/          controllers + request/response DTOs (thin)
 *   application/  application services — orchestration, transactions
 *   domain/       entities, value objects, domain rules (no framework deps where possible)
 *   infra/        JPA repositories, entity mappers, external adapters
 *
 * Rules: expose services/DTOs to other modules, never JPA entities.
 * Every query is scoped by organization_id taken from the authenticated context.
 */
