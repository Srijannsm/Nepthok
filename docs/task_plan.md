# Task Plan — Nepthok

> Last updated: 2026-05-16

---

## Phase 1 — Foundation & Infrastructure
- ✅ Initialize Turborepo monorepo
- ✅ Scaffold Next.js 14 (App Router, TypeScript, Tailwind, ESLint)
- ✅ Scaffold NestJS API app (TypeScript, ESLint)
- ✅ Create `packages/database` with Prisma + PostgreSQL provider
- ✅ Create `packages/types` with shared TypeScript types
- ✅ Create `packages/utils` with shared utility functions
- ✅ Write project docs (constitution, task_plan, findings, progress)
- ✅ Initialize git repository and make first commit

---

## Phase 2 — Data Schema & Database
- ✅ Define core Prisma models: Tenant, User, Product, Order, Payment, Review
- ✅ Add multi-tenant fields (`tenantId`) to all relevant models
- ✅ Write and run initial migrations
- ✅ Set up Prisma client singleton export in `packages/database`
- ✅ NestJS core setup: PrismaService, ConfigModule, ResponseInterceptor, HttpExceptionFilter, PrismaExceptionFilter, ValidationPipe
- ✅ Auth module: JWT strategy, JwtAuthGuard, RolesGuard, TenantGuard, @Roles/@CurrentUser/@CurrentTenant decorators
- ✅ Seed script for development data (SUPER_ADMIN user seeded)
- ✅ Add Prisma middleware for automatic tenant scoping
- ✅ Tenant module (seller onboarding, tenant CRUD)

---

## Phase 3 — Seller Admin + Super Admin Frontend ✅
- ✅ Login page (JWT, role-aware redirect: SUPER_ADMIN → /superadmin, sellers → /dashboard)
- ✅ Seller admin panel: Dashboard, Products, Orders, Inventory, Store Settings, Subscription, Discounts (Pro-gated), Analytics (Pro-gated)
- ✅ Super admin panel: Dashboard, Sellers, Plans, Subscriptions, Categories, Orders, Analytics
- ✅ NK design system (primitives: Icon, Logo, layout tokens)
- ✅ Role-based routing with Zustand auth store + hydration guard

---

## Phase 4 — Public Marketplace 🔄 (in progress)
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
