# Progress Log — Nepthok

---

## Session 1 — 2026-05-14

**Goal:** Initialize the full project foundation before writing any application code.

**What was done:**

- Created Turborepo monorepo root with `package.json` (npm workspaces), `turbo.json` (build pipeline), `.gitignore`, and root `tsconfig.json`
- Scaffolded `apps/web` — Next.js 14 with App Router, TypeScript, Tailwind CSS, ESLint, PostCSS, and a placeholder home page
- Scaffolded `apps/api` — NestJS with TypeScript, ESLint, `nest-cli.json`, and a `/api/health` endpoint
- Set up `packages/database` — Prisma with PostgreSQL provider, placeholder `schema.prisma` with datasource and generator blocks
- Set up `packages/types` — minimal TypeScript package with `ApiResponse` and `PaginatedResponse` types
- Set up `packages/utils` — minimal TypeScript package with `slugify`, `formatCurrency`, `generateId`, and `omit` utilities
- Wrote all four docs files: `constitution.md`, `task_plan.md`, `findings.md`, `progress.md`
- Initialized git repository and made the first commit: `chore: initialize monorepo foundation`

**Phase 1 checklist:** All items complete. ✓

**Next session focus:**
- Phase 2: Define Prisma data models (Tenant, User, Product, Order, Payment, Review)
- Run `npm install` across the monorepo
- Set up local PostgreSQL and `.env` files
- Write and run first migration

---

## Session 3 — 2026-05-15

### Completed
- NestJS API foundation: PrismaService, ConfigModule, ResponseInterceptor, HttpExceptionFilter, PrismaExceptionFilter, ValidationPipe all wired in main.ts
- API smoke test passed: GET /api/health returns correct envelope
- Auth module complete: JWT strategy, JwtAuthGuard, RolesGuard, TenantGuard
- Decorators: @Roles, @CurrentUser, @CurrentTenant
- DTOs: LoginDto, AuthResponseDto
- Seeded first SUPER_ADMIN user: admin@nepthok.com
- All 4 auth tests passed:
  * Valid login returns JWT ✅
  * Wrong password returns same error as wrong email (user enumeration prevention) ✅
  * Valid JWT accesses protected route, no password in response ✅
  * No token returns 401 ✅

### Security Pillars Verified
- Pillar 1: User enumeration prevention, JWT guards active
- Pillar 3: Password field excluded from all profile responses

### Tenant Module Complete
- TenantsService: create (atomic $transaction), findAll (paginated), findOne, findBySlug, approve, suspend, update, getMyTenant
- TenantsController: 7 endpoints with correct @Roles guards
- TenantMiddleware: resolves tenant from X-Tenant-Slug header or /store/:slug path
- DTOs: CreateTenantDto (Nepal phone regex), UpdateTenantDto, TenantResponseDto
- All 7 tenant tests passed:
  * Atomic tenant creation ✅
  * Duplicate slug 409 ✅
  * Paginated admin list ✅
  * Approval flow PENDING→ACTIVE ✅
  * Seller login with correct tenantId in JWT ✅
  * Seller scoped to own tenant ✅
  * Role isolation — seller blocked from admin routes ✅

### Plans Module Complete
- PlansService: create (slug-unique), findAll (active only), findOne, update, deactivate (soft delete)
- PlansController: GET /plans + GET /plans/:id public; POST/PATCH/DELETE SUPER_ADMIN guarded
- Seeded: Basic (NPR 999/month, max 50 products) and Pro (NPR 2499/month, unlimited)

### Subscriptions Module Complete — commit f0447b2
- SubscriptionsService: create (TRIAL), recordPayment (atomic tx → ACTIVE + period reset), findByTenant, checkAccess, expire, cancel
- SubscriptionsController: 5 endpoints with correct role guards
- All 5 subscription tests passed:
  * Assign Basic plan → status TRIAL ✅
  * Record ESEWA payment → status ACTIVE, period reset ✅
  * Seller fetches own subscription with plan + payment history ✅
  * Feature gate: order_management → true (Basic feature) ✅
  * Feature gate: sms_messaging → false (Pro-only feature) ✅

### Categories Module Complete
- CategoriesService: create (slug-unique), findAll (nested children), findOne, update, deactivate (blocks if active children)
- CategoriesController: GET public; POST/PATCH/DELETE SUPER_ADMIN
- Seeded 5 categories: Phone Cases, Chargers & Cables, Screen Protectors, Earphones & Headphones, Power Banks

### Products Module Complete — commit 50f1820
- ProductsService: create (subscription+plan-limit gate), findAll (tenant-scoped), findAllAdmin, findPublic, findOne, findOnePublic, update (pending-order check on archive), updateStock (atomic tx), delete (blocks if order history)
- ProductsController: @Controller() — public/seller/admin route groups in one file
- All 8 product tests passed:
  * Public categories visible without auth ✅
  * Seller creates DRAFT product (subscription gated) ✅
  * DRAFT hidden from public browse ✅
  * Seller activates product → ACTIVE ✅
  * Public sees ACTIVE product ✅
  * Search + price filter works ✅
  * Atomic stock decrement (50 → 45) ✅
  * Hard delete succeeds (no orders); product recreated and activated ✅

### Volume Pricing — Tested
- pricingTiers stored per product as JSON
- GET /products/:id/price?quantity=n returns correct tier
- Retail (qty 5): NPR 850/pc ✅
- Wholesale tier 1 (qty 10): NPR 720/pc ✅
- Wholesale tier 2 (qty 50): NPR 650/pc ✅
- Invalid price (wholesale > retail): 400 rejected ✅
- Invalid threshold (below 10): 400 rejected ✅

### Fixes in this session
- `import type` for PricingTier in packages/utils (interface has no runtime value)
- `tierApplied: matchedTier.price !== product.price` — false for retail tier, true only for discounted tiers
- `turbo.json`: renamed deprecated `pipeline` → `tasks` (Turbo 2.x)

### Orders Module Complete — commit b12883b
- CreateOrderDto: buyer details, ShippingAddressDto, OrderItemDto, PaymentMethod enum
- UpdateOrderStatusDto, OrderQueryDto (pagination, status, search, dateFrom/dateTo)
- OrdersService: atomic $transaction create (tenant check, stock validation, discount code
  validation, calculatePrice per item, orderNumber generation NTK-XXXXX, stock decrement,
  usedCount increment); state machine updateStatus; trackOrder (orderNumber+email — enumeration safe)
- OrdersController: POST /orders + GET /orders/track (public); GET/PATCH/DELETE seller routes with RBAC
- All 10 order tests passed (Gadget Hub tenant — pricing tiers active):
  * Retail order (qty 3): NTK-00001, subtotal NPR 2550 (850×3), status PENDING ✅
  * Wholesale order (qty 10): NTK-00002, subtotal NPR 7200 (720×10) via tier ✅
  * Stock decremented atomically: 200 → 187 (−3 −10) ✅
  * Seller sees paginated order list, total: 2 ✅
  * Seller confirms order: PENDING → CONFIRMED, statusHistory 2 entries ✅
  * Invalid transition CONFIRMED → DELIVERED: 400 "Invalid status transition" ✅
  * Buyer tracks by orderNumber + email: returns status + items ✅
  * Wrong email returns 404 (same error as non-existent — prevents order enumeration) ✅
  * qty 300 with stock 187: 400 "Insufficient stock for: iPhone 15 Silicone Case" ✅
  * Full lifecycle CONFIRMED → PROCESSING → SHIPPED → DELIVERED, 5 history entries ✅
- TODO: Discount code test (DiscountCodes module not yet built)

### Next Session
- Discount Codes module
- Analytics module
- Payment gateway integration (eSewa + Khalti)

---

## Session 2 — 2026-05-14

### Completed
- Installed and configured PostgreSQL 17 locally
- Created nepthok_dev database
- Created root .env with DATABASE_URL, JWT secrets, ports
- Created CLAUDE.md via /init, enriched with roles, tiers, delivery, SMS, payment, and token efficiency rules
- Wrote complete Prisma schema — 14 models, 10 enums, all relations and constraints
- Ran first migration: 20260514173314_init_schema — 14 tables created in PostgreSQL
- Prisma Client generated at packages/database/generated/client
- Prisma Studio verified at http://localhost:5555

### Known Issues
- postcss <8.5.10 inside Next.js — accepted moderate risk, documented in CLAUDE.md

### Next Session
- Phase 2: NestJS API foundation — Prisma module, config module, global exception filter, response interceptor

---
