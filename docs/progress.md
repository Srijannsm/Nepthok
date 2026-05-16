# Progress Log — Nepthok

---

## Session 4 — 2026-05-16

**Goal:** Fix super admin redirect, implement Prisma tenant scoping middleware, update stale docs.

### Super Admin Login Redirect
- Verified login page already reads `data.user.role` directly from API response (line 36 of `apps/web/src/app/login/page.tsx`) — no store hydration dependency. Bug was already fixed in commit `11c73d2`. No code change needed.

### Prisma Tenant Scoping Middleware
- Created `apps/api/src/prisma/tenant-context.ts`: `AsyncLocalStorage`-based context with `setTenantContext(tenantId, fn)` and `getTenantId()`.
- Created `apps/api/src/prisma/tenant-scope.middleware.ts`: `Prisma.Middleware` that injects `tenantId` into `findMany`, `findFirst`, `update`, `delete` operations for: Product, Order, OrderItem, DiscountCode, StoreAnalytics, ContactMessage. Converts `findUnique` → `findFirst` to support the tenantId filter alongside a unique id.
- Updated `apps/api/src/common/middleware/tenant.middleware.ts`: wraps `next()` in `setTenantContext(tenant.id, ...)` so all downstream async operations inherit the tenant context. No-slug (SUPER_ADMIN) path uses `setTenantContext(null, ...)`.
- Updated `apps/api/src/prisma/prisma.service.ts`: registers `tenantScopeMiddleware` via `this.$use()` in `onModuleInit`.

### Documentation Updated
- `CLAUDE.md`: Phase Status section updated to reflect Phases 1–3 complete, Phase 4 in progress.
- `docs/constitution.md`: Data Schema section filled in with all 12 models and key fields; Auth Strategy updated from "TBD" to "JWT (NestJS Passport + @nestjs/jwt)"; Tenant Isolation Rule 3 updated to reflect middleware is implemented.
- `docs/task_plan.md`: Phase 2 remaining items marked ✅; Phase 3 section replaced with accurate frontend completion checklist; Phase 4 title updated to "Public Marketplace 🔄 (in progress)".

**Phase 4 starts next.**

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

### Discount Codes Module Complete — commit ce9119a
- DiscountCode model: code (unique per tenant), type (PERCENTAGE/FIXED), value, minOrderAmount, maxUses, usedCount, isActive, expiresAt, discountProducts (M2M for product-scoped codes)
- DiscountsService: create (Pro gate via subscription feature check), findAll, findOne, update, delete, validate (public — checks active, expiry, maxUses, minOrderAmount, calculates amount)
- DiscountsController: GET /discounts/validate (public); seller CRUD with RBAC
- Orders integration: discountCode field on CreateOrderDto, full validation + usedCount increment inside atomic transaction

### Discount Codes — Tests (2026-05-15)

**Bugs found and fixed during testing:**
1. `SubscriptionsService.create()` — P2002 when re-subscribing after cancel (unique tenantId constraint). Fixed: `upsert` pattern — UPDATE existing record if cancelled, CREATE if none exists.
2. `ValidateDiscountDto.orderAmount` — missing `@Type(() => Number)` transform; query string parsed as string, failed `@IsNumber()`. Fixed: added `class-transformer` Type decorator.
3. `OrdersService` orderNumber — `@unique` global but counter was per-tenant; caused P2002 when two tenants both generated NTK-00001. Fixed: prefix with tenant slug (e.g. `TECH-00001`, `GADG-00001`).

**All 6 tests passed:**
- TEST 1: Basic seller blocked from creating discount code → 403 "Upgrade to Pro to use discount codes" ✅
- TEST 2: Seller upgraded to Pro (cancel Basic → reassign Pro → record payment) → discount code created, 201 ✅
- TEST 3: Validate SAVE10 (10%) on NPR 2000 → discountAmount: 200, finalAmount: 1800 ✅
- TEST 4: Validate MINAMOUNT (15%, min NPR 1000) with orderAmount 500 → 400 "Minimum order amount for this code is NPR 1000" ✅
- TEST 5: Validate FAKECODE → 400 "Invalid or expired discount code" (same message — no enumeration) ✅
- TEST 6: Place order TECH-00001 with SAVE10 — subtotal 2550, discount 255, total 2295; usedCount incremented to 1 ✅

### Analytics Module Complete — commit 5f97094
- AnalyticsQueryDto: dateFrom, dateTo, period shortcuts (7d/30d/90d)
- AnalyticsService: getDashboard (live fallback from Orders when no snapshots; StoreAnalytics snapshots when available), getPlatformOverview (cross-tenant summary, MRR, subscriptionBreakdown), recordDailySnapshot (upsert by tenantId+date midnight UTC), recordAllTenantsSnapshot (batch all ACTIVE tenants)
- AnalyticsController: GET /analytics/dashboard (SELLER_ADMIN/STAFF), GET /analytics/platform (SUPER_ADMIN), POST /analytics/snapshot (SUPER_ADMIN manual trigger)
- lowStockProducts via $queryRaw for column-to-column stock ≤ lowStockThreshold comparison

**All 5 tests passed (2026-05-15):**
- TEST 1: Seller dashboard live fallback → totalOrders: 1, topProducts, recentOrders, trend: [] ✅
- TEST 2: Platform overview → totalTenants: 2, subscriptionBreakdown {basic:1,pro:1}, MRR: 3498 NPR ✅
- TEST 3: Seller blocked from /analytics/platform → 403 ✅
- TEST 4: Manual snapshot trigger → snapshotsRecorded: 2 ✅
- TEST 5: Dashboard uses snapshot data → trend array with 2 daily records ✅

---

## Phase 3 — COMPLETE (2026-05-16)

### Seller Admin Panel ✅
- Login, Dashboard (role-aware), Products, Orders, Inventory, Store Settings, Subscription, Discounts (Pro-gated), Analytics (Pro-gated)
- Auth race condition fixed: `hydrated` flag in Zustand store prevents redirect before localStorage is read
- Dashboard: SUPER_ADMIN sees platform stats, sellers see store stats

### Super Admin Panel ✅
- Layout: sidebar with Super Admin badge, logout button, no mobile tab bar
- Dashboard (`/superadmin`): 4 KPI cards (Total Sellers, MRR, Total Orders, Pending Approvals), Recent Stores table, Subscription breakdown
- Sellers (`/superadmin/sellers`): search + status filter, approve/suspend with confirmation dialog, detail sheet
- Plans (`/superadmin/plans`): plan cards with edit sheet (name, price, maxProducts, features, isActive)
- Subscriptions (`/superadmin/subscriptions`): status filter tabs, record payment dialog, assign plan dialog
- Categories (`/superadmin/categories`): nested tree table, add/edit sheet with slug auto-fill, deactivate confirmation
- Orders (`/superadmin/orders`): read-only all-orders view with search + status filter, detail sheet
- Analytics (`/superadmin/analytics`): period selector (7d/30d/90d), KPI cards, top sellers table, subscription breakdown bar chart

### API additions for Super Admin ✅
- `GET /subscriptions` (SUPER_ADMIN): paginated all-subscriptions with tenant + plan + last payment
- `GET /admin/orders` (SUPER_ADMIN): paginated all-orders without tenantId scope
- Both backed by `findAll()` and `findAllAdmin()` service methods

### Role-based routing ✅
- `SUPER_ADMIN` → `/superadmin`
- `SELLER_ADMIN`/`SELLER_STAFF` → `/dashboard`
- Unauthenticated → `/login`

---

## Backend API — COMPLETE

All modules built and tested:
- Auth (JWT, guards, role decorators)
- Tenants (onboarding, approval, middleware)
- Plans (Basic/Pro tiers)
- Subscriptions (lifecycle, feature gating, checkAccess)
- Categories (platform-wide, nested)
- Products (CRUD, stock, volume pricing, subscription gating)
- Orders (atomic creation, state machine, wholesale pricing, guest tracking)
- Discount Codes (Pro-gated, validation, order integration)
- Analytics (dashboard, platform overview, daily snapshots)

Bugs caught and fixed during testing:
- Re-subscription unique constraint (update vs insert)
- Query string number coercion (@Type(() => Number))
- Order number global collision (tenant-prefixed slugs)
- Prisma JSON null sentinel pattern
- Column-to-column comparison via $queryRaw

Next: Phase 3 — Frontend (Next.js seller admin panel)

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
