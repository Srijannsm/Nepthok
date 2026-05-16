# Project Constitution — Nepthok

## Project Overview

Nepthok is a multi-tenant SaaS marketplace built for the Nepali market. It enables businesses (tenants) to list and sell products or services, while end-users can discover, purchase, and review them. The platform supports multiple payment gateways (eSewa, Khalti), SMS-based notifications, and is deployed on DigitalOcean.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend API | NestJS, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Monorepo | Turborepo with npm workspaces |
| Auth | JWT (NestJS Passport + @nestjs/jwt) |
| Payments | eSewa, Khalti |
| SMS | To be documented |
| Hosting | DigitalOcean (Droplets / App Platform) |
| CI/CD | To be decided |

---

## Architectural Rules

1. **Monorepo-first.** All apps and shared packages live in this repository. Cross-cutting logic belongs in `packages/`, never duplicated across apps.
2. **Strict tenant isolation.** Every database query that touches tenant-scoped data MUST include a `tenantId` filter. No exceptions.
3. **API-first.** The `apps/web` frontend MUST only talk to `apps/api`. Direct database access from the frontend is forbidden.
4. **Typed contracts.** All API request/response shapes MUST be defined in `packages/types` and shared by both apps.
5. **Environment variables.** Secrets MUST live in `.env` files (never committed). Each app has its own `.env.example` documenting required vars.
6. **Build pipeline.** All packages and apps MUST pass `type-check` and `lint` before any deployment.
7. **No circular dependencies.** `packages/*` must not import from `apps/*`. Apps may import from packages, never from each other.

---

## Security Invariants

The following five areas MUST be audited before each production release:

1. **Authentication & Authorization** — All protected routes/endpoints verify JWT validity and tenant membership. Role-based access control (RBAC) enforced at the API layer.
2. **Tenant Data Isolation** — Row-level filtering by `tenantId` on every query. Multi-tenant data leakage is a P0 bug.
3. **Input Validation & Injection Prevention** — All user inputs validated with a schema library (Zod / class-validator). SQL injection prevented by Prisma parameterized queries. XSS prevented via React's JSX escaping and Content Security Policy headers.
4. **Payment Integrity** — Payment webhook signatures verified server-side. Payment amounts never trusted from the client. Idempotency keys used for payment creation.
5. **Secrets & Environment Hygiene** — No secrets in source code or logs. All credentials rotatable without code changes. `.env` files are gitignored.

---

## Data Schema

Defined in `packages/database/prisma/schema.prisma`. 14 models, 10 enums.

**Core tenant-scoped models** (all carry a non-nullable `tenantId`):

| Model | Key fields |
|---|---|
| **Tenant** | id, name, slug, status (PENDING/ACTIVE/SUSPENDED/CANCELLED), ownerId |
| **Product** | id, tenantId, name, slug, price, comparePrice, stock, lowStockThreshold, status (DRAFT/ACTIVE/ARCHIVED), categoryId, pricingTiers (JSON) |
| **Order** | id, tenantId, orderNumber (tenant-prefixed, e.g. TECH-00001), status (state machine), buyerName/Email/Phone, shippingAddress (JSON), subtotal/shippingFee/discount/total, paymentMethod/Status |
| **OrderItem** | id, orderId, tenantId (denormalized), productId, productName snapshot, quantity, unitPrice, total |
| **DiscountCode** | id, tenantId, code, type (PERCENTAGE/FIXED), value, minOrderAmount, maxUses, usedCount, expiresAt |
| **StoreAnalytics** | id, tenantId, date (midnight UTC, unique per tenant+day), totalOrders, totalRevenue, totalProductViews |
| **ContactMessage** | id, tenantId (nullable — null = platform-level), name, email, message, isRead |

**Platform-scoped models** (no tenantId):

| Model | Key fields |
|---|---|
| **User** | id, email, password (hashed), role (SUPER_ADMIN/SELLER_ADMIN/SELLER_STAFF), tenantId (nullable — null for SUPER_ADMIN) |
| **Plan** | id, tier (BASIC/PRO), price, billingCycle, maxProducts (null = unlimited), features (JSON) |
| **Subscription** | id, tenantId @unique, planId, status (TRIAL/ACTIVE/PAST_DUE/CANCELLED/EXPIRED), currentPeriodStart/End |
| **SubscriptionPayment** | id, subscriptionId, tenantId (denormalized), amount, method, status, transactionId @unique |
| **Category** | id, name, slug @unique, parentId (self-referential tree), isActive |

**Tenant middleware:** `apps/api/src/prisma/tenant-scope.middleware.ts` automatically injects `tenantId` into `findMany`, `findFirst`, `update`, `delete` queries for the 6 tenant-scoped models. `findUnique` is downgraded to `findFirst` to support the filter. SUPER_ADMIN requests bypass it via `setTenantContext(null, ...)` in `TenantMiddleware`.

---

## API Contract Rules

1. All endpoints are prefixed with `/api`.
2. Responses follow the `ApiResponse<T>` envelope defined in `packages/types`.
3. Pagination uses `page` + `pageSize` query params; responses follow `PaginatedResponse<T>`.
4. HTTP status codes are used semantically: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Internal Server Error`.
5. Errors return `{ success: false, message: string, errors?: Record<string, string[]> }`.
6. Versioning strategy: `/api/v1/...` — bump major version only on breaking changes.

---

## Tenant Isolation Rules

1. Every tenant-scoped database table has a non-nullable `tenantId` column.
2. The API resolves `tenantId` from the authenticated JWT; it is never accepted as a user-supplied parameter in request bodies.
3. Prisma middleware (`tenant-scope.middleware.ts`) enforces automatic `tenantId` scoping on all tenant-scoped models via AsyncLocalStorage. Implemented in Phase 2.
4. Super-admin routes (cross-tenant reads) are separate, explicitly guarded, and audited.
5. File storage (images, documents) is namespaced by `tenantId` (e.g., `/uploads/{tenantId}/...`).
