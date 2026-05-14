# Task Plan — Nepthok

> Last updated: 2026-05-14

---

## Phase 1 — Foundation & Infrastructure
- [x] Initialize Turborepo monorepo
- [x] Scaffold Next.js 14 (App Router, TypeScript, Tailwind, ESLint)
- [x] Scaffold NestJS API app (TypeScript, ESLint)
- [x] Create `packages/database` with Prisma + PostgreSQL provider
- [x] Create `packages/types` with shared TypeScript types
- [x] Create `packages/utils` with shared utility functions
- [x] Write project docs (constitution, task_plan, findings, progress)
- [x] Initialize git repository and make first commit

---

## Phase 2 — Data Schema & Database
- [ ] Define core Prisma models: Tenant, User, Product, Order, Payment, Review
- [ ] Add multi-tenant fields (`tenantId`) to all relevant models
- [ ] Write and run initial migrations
- [ ] Set up Prisma client singleton export in `packages/database`
- [ ] Add Prisma middleware for automatic tenant scoping
- [ ] Seed script for development data

---

## Phase 3 — Authentication & Tenancy
- [ ] Choose auth strategy (JWT / NextAuth / Clerk) and document decision
- [ ] Implement registration and login endpoints in NestJS
- [ ] JWT issuance, refresh, and revocation
- [ ] Tenant creation flow (on-boarding a new vendor)
- [ ] Role-based access control (buyer, seller, admin)
- [ ] Auth guards on all protected API routes
- [ ] Session handling in Next.js frontend

---

## Phase 4 — Core Marketplace Features
- [ ] Tenant profile management (CRUD)
- [ ] Product/service listing CRUD for tenants
- [ ] Product image upload (tenant-namespaced storage)
- [ ] Buyer product discovery (search, filter, pagination)
- [ ] Product detail page
- [ ] Cart / order creation flow
- [ ] Order management for tenants

---

## Phase 5 — Payments
- [ ] Integrate eSewa payment gateway
- [ ] Integrate Khalti payment gateway
- [ ] Webhook handlers for payment confirmation
- [ ] Server-side signature verification
- [ ] Idempotent payment creation
- [ ] Payment status tracking and receipts
- [ ] Refund flow (basic)

---

## Phase 6 — Reviews & Social Proof
- [ ] Review model and API (create, read, list by product)
- [ ] Star rating aggregation
- [ ] Prevent duplicate reviews per order
- [ ] Review moderation (admin flag/hide)

---

## Phase 7 — Notifications & Communication
- [ ] Document SMS provider and API contract
- [ ] Order confirmation SMS to buyer
- [ ] New order alert SMS to tenant
- [ ] Email notification templates (optional)
- [ ] In-app notification feed (optional)

---

## Phase 8 — DevOps & Production Readiness
- [ ] Dockerize `apps/api` and `apps/web`
- [ ] Docker Compose for local full-stack development
- [ ] DigitalOcean deployment configuration
- [ ] CI/CD pipeline (GitHub Actions or similar)
- [ ] Environment variable management (staging vs. production)
- [ ] Database backup strategy
- [ ] Monitoring and error tracking setup
- [ ] Security audit (all 5 invariant areas)
- [ ] Performance testing and load testing
- [ ] Go-live checklist and runbook
