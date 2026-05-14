# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all apps in dev mode (Turborepo parallel)
npm run dev

# Build everything (respects dependency order: packages before apps)
npm run build

# Type-check all packages and apps
npm run type-check

# Lint all packages and apps
npm run lint

# Run tests across the monorepo
npm run test

# Run tests for a single package (from repo root)
npm run test --workspace=apps/api

# Prisma migrations (from repo root, targeting the database package)
npx prisma migrate dev --schema=packages/database/prisma/schema.prisma
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Clean all build artifacts
npm run clean
```

The API runs on port `3001` by default (`PORT` env var). The web app runs on Next.js default port `3000`.

## Architecture

This is a **Turborepo monorepo** with npm workspaces. Build order is enforced: `packages/*` always build before `apps/*`.

```
apps/api      — NestJS backend, all routes prefixed /api, currently at /api/v1/...
apps/web      — Next.js 14 App Router frontend
packages/database  — Prisma client + schema, exports singleton client
packages/types     — Shared API request/response types (ApiResponse<T>, PaginatedResponse<T>)
packages/utils     — Shared pure utilities (slugify, formatCurrency, generateId, omit)
docs/              — constitution.md, task_plan.md, findings.md, progress.md
```

**Key data flow rule:** `apps/web` → `apps/api` → `packages/database` → PostgreSQL. The frontend never accesses the database directly.

**Package graph rule:** `packages/*` must not import from `apps/*`. Apps may import from packages, never from each other.

## Multi-Tenancy Rules (critical)

- Every tenant-scoped database table has a non-nullable `tenantId` column.
- `tenantId` is resolved from the authenticated JWT server-side — never accepted from the request body.
- Prisma middleware will enforce automatic tenant scoping on all tenant-scoped models (Phase 2).
- File storage is namespaced: `/uploads/{tenantId}/...`.

## API Contract

- All responses use the `ApiResponse<T>` envelope from `packages/types`.
- Pagination responses use `PaginatedResponse<T>` with `page` + `pageSize` query params.
- Error shape: `{ success: false, message: string, errors?: Record<string, string[]> }`.
- Versioning: `/api/v1/...` — major version bump only for breaking changes.

## Security Invariants

Before any production release, audit these five areas (see `docs/constitution.md` for full detail):
1. Authentication & Authorization — JWT validity + RBAC at API layer
2. Tenant Data Isolation — every query filtered by `tenantId`
3. Input Validation — Zod / class-validator on all user input; Prisma prevents SQL injection
4. Payment Integrity — webhook signatures verified server-side; amounts never trusted from client
5. Secrets & Environment Hygiene — no secrets in source or logs; all `.env` files gitignored

## Environment Variables

Each app needs its own `.env` file (gitignored). Required variables:
- `apps/api`: `DATABASE_URL`, `PORT`
- `packages/database`: `DATABASE_URL`

Database: **PostgreSQL 15+**. Currency: **NPR only** at launch. Payments: **eSewa + Khalti** (Nepal gateways). Hosting target: **DigitalOcean sgp1 (Singapore)**.

## Phase Status

See `docs/task_plan.md` for the full phase checklist. Current state:
- **Phase 1 (Foundation):** Complete
- **Phase 2 (Data Schema):** Next — define Prisma models, run first migration, set up tenant scoping middleware

## Roles & Permissions
- SUPER_ADMIN: full platform access, approves sellers, manages plans, sees all analytics
- SELLER_ADMIN: full access within their tenant only
- SELLER_STAFF: view orders, manage products, no billing/settings access
- BUYER: guest only, no account, email-based order tracking

## Subscription Tiers
- BASIC: max 50 products, order management, inventory, store profile
- PRO: unlimited products, analytics, discount codes, CSV/PDF exports, SMS messaging module

## Delivery
- Phase 1-6: seller handles delivery independently
- Phase 7+: Pathao courier API integration

## SMS Messaging Module
- Pre-built by external developer, needs integration in Phase 7
- Exposed as optional feature in seller admin panel (PRO tier only)
- Sellers send SMS to customer phone numbers from their order history
- Integration via API call to external messaging system (docs TBD)

## Payment Gateways
- Buyer payments: eSewa + Khalti + Cash on Delivery (COD)
- Seller subscription payments: eSewa + Khalti + manual bank transfer
- All payment states must use atomic DB transactions

## Known Accepted Risks
- postcss <8.5.10 inside Next.js node_modules — unfixable without downgrading Next.js to v9, accepted moderate risk
- Mitigation: never pass unsanitized user input into CSS generation

## Prompt Efficiency Rules (for Claude Code)
- Skip explanations unless asked
- Batch related file creation into single responses
- Always reference existing files by path, never rewrite from memory
- Check CLAUDE.md before every task
