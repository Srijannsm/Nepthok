# Nepthok Seller UI Redesign — Design Spec

_2026-05-16_

## Summary

Full redesign of the Nepthok seller admin panel (login + all 10 admin screens) based on designs exported from Claude Design. The aesthetic is a modern data-CRM style (Linear/Stripe density), monochrome neutrals + indigo `#4f46e5` accent, Geist fonts, with full light/dark support.

## Decisions

- **Login variant**: C — dark marketing hero panel left, minimal sign-in form right
- **Dashboard variant**: C — activity-first with today hero band, live feed, stacked widgets
- **Scope**: All screens — Login, Dashboard, Orders, Products, Inventory, Analytics, Discounts, Subscription, Store Settings, Messages
- **Theme integration**: NK CSS variable system added to `globals.css` alongside existing Tailwind config; no Tailwind variables replaced

## Theme System

CSS variables defined on `.nk-root.nk-light` and `.nk-root.nk-dark`. Applied to the admin layout wrapper. Key tokens:

| Token | Light | Dark |
|---|---|---|
| `--nk-accent` | `#4f46e5` | `#4f46e5` |
| `--nk-bg` | `#fafafa` | `#0a0a0a` |
| `--nk-surface` | `#ffffff` | `#111113` |
| `--nk-fg` | `#0a0a0a` | `#fafafa` |
| `--nk-border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.08)` |

Density variants: `.nk-compact`, `.nk-balanced` (default), `.nk-comfy` — control row heights, padding, gap via CSS props.

Typography: Geist Sans + Geist Mono loaded via Google Fonts (already referenced by design). Font feature settings: `cv11`, `ss01`. Tabular numerals on all data via `.nk-tnum`.

## Component Architecture

New directory: `apps/web/src/components/nk/`

| Component | Purpose |
|---|---|
| `Icon.tsx` | SVG icon set (lucide-style strokes, ~50 icons) |
| `Logo.tsx` | Logo mark + word mark |
| `Avatar.tsx` | Initials avatar with tone color |
| `Badge.tsx` | Colored badge (success/warn/danger/info/accent/neutral) |
| `StatusBadge.tsx` | Order/product status → badge mapping |
| `Sparkline.tsx` | Mini SVG area + line chart for KPI cards |
| `MiniBar.tsx` | Horizontal bar for top-products list |
| `AreaChart.tsx` | Full revenue area chart (SVG, viewBox-based) |
| `Donut.tsx` | Payment breakdown donut |
| `KPICard.tsx` | KPI tile with sparkline + delta |
| `FieldWithIcon.tsx` | Input wrapper with leading icon |
| `Divider.tsx` | Horizontal/vertical divider |

Layout components (keep in `components/admin/`):
- `Sidebar.tsx` — redesigned: store switcher, search, nav items with counts/dots, PRO usage card, user footer
- `Topbar.tsx` — redesigned: breadcrumbs, title, action slots, help + bell icons

## Page Designs

### Login (`/login`)

Split screen, `1.05fr / 1fr`. Left panel: dark `bg-nk-fg` with geometric SVG watermark, Nepthok logomark (white), large headline, 3 feature bullets, hosting/uptime footer. Right panel: "Don't have an account? Sign up" header, centered sign-in form.

**LoginForm**: tabbed mode switcher (Email | Phone·OTP). Email mode: work email input + password input with Forgot? link. Phone mode: Nepal flag + `+977` prefix input, OTP input grid (6 boxes) when sent. Primary CTA button changes label by mode. "Become a seller →" link below divider.

### Dashboard (`/dashboard`)

**Today Hero Band** (3-column card):
- Col 1: Live indicator dot, "Today · HH:MM NPT", large revenue number + badge, order count, period selector tabs
- Col 2: Hourly revenue area chart (12 points, 7am–7pm)
- Col 3: Today's payments — eSewa/Khalti/COD each with mini progress bar

**Two-column body** (`1.05fr / 1fr`):
- Left: Live Activity feed card (6 items with timeline connector) + Recent Orders table (4 rows)
- Right: Fulfillment + Conversion mini KPI pair, Needs Attention card, Messages card (PRO), PRO Insight dark card

### Orders (`/orders`)

Page header with total + revenue. Filter tabs (All/Pending/Paid/Shipped/Fulfilled/Refunded) with counts. Search input + Filters button. Bulk-select toolbar when rows selected (mark paid/shipped, print labels, send SMS). Full table with checkbox, order ID (mono), customer avatar+name, items, payment badge, status badge, placed date, total. Pagination footer.

### Products (`/products`)

Page header. Toolbar: search, Category/Status/Price dropdowns, grid/list toggle. **Grid view**: cards with hatch-pattern image placeholder, status badge overlay, name, SKU (mono), price + stock. **List view**: standard table with SKU, name+thumbnail, category, status, price, stock, sold-30d.

### Inventory (`/inventory`)

4 KPI cards (Total SKUs, Inventory value, Low stock, Out of stock). Table with SKU, product name, on-hand (colored by tone), reserved, incoming, sellable, reorder-point progress bar, Reorder button for low/out items.

### Analytics (`/analytics`)

4 KPI cards. Full-width revenue area chart with 7d/30d/90d/YTD selector. Two-column: top products by revenue (bar chart) + revenue by city (progress bars with percentages, NPR values).

### Discounts (`/discounts`)

Page header with aggregate stats. Table: code chip (mono bg), description, discount badge, used/limit with progress bar, expiry, status badge, action menu.

### Subscription (`/subscription`)

Current plan banner (PRO badge, renewal date, price/method). Usage widget: 2×2 grid of Products/SMS/Storage/Staff with progress bars. Plans comparison: Basic + PRO cards, PRO has double accent border, feature checklist, CTA buttons.

### Store Settings (`/store-settings`)

Profile card: logo upload, store name + handle (with `.nepthok.com` suffix label), description textarea. Currency & payments card: currency/region inputs, payment method toggle chips (eSewa/Khalti/COD/Bank). Save/Discard footer.

### Messages (`/messages`)

Two-panel SMS inbox. Left: search + thread list (avatar, name, snippet, time, unread dot). Active thread has accent left border. SMS quota progress footer. Right: contact header (avatar, name, phone+city, view profile + orders buttons), scrollable message bubbles (their = surface card, ours = accent bg), compose textarea with char counter + Send SMS button, template quick-links.

## Data Wiring

All pages pull from the existing API. Mock data from the design (`NK_DATA`) is reference-only — real data comes from the API client at `apps/web/src/lib/api.ts`. Date formatting uses `en-GB` locale. Currency uses `Rs. X,XX,XXX` format (matching existing `formatCurrency` in `packages/utils`).

New page: Messages will require an API endpoint check — if not yet implemented, render the UI with empty state handling.

## What Doesn't Change

- Auth logic, Zustand store, JWT handling
- `apps/api` — no backend changes
- Super admin panel (`/superadmin/*`)
- `packages/` — no changes

## Files Modified

- `apps/web/src/app/globals.css` — add NK theme tokens
- `apps/web/src/app/login/page.tsx` — full rewrite
- `apps/web/src/app/(admin)/layout.tsx` — use new Sidebar + Topbar, add `.nk-root.nk-light` wrapper
- `apps/web/src/app/(admin)/dashboard/page.tsx` — Variant C
- `apps/web/src/app/(admin)/orders/page.tsx`
- `apps/web/src/app/(admin)/products/page.tsx`
- `apps/web/src/app/(admin)/inventory/page.tsx`
- `apps/web/src/app/(admin)/analytics/page.tsx`
- `apps/web/src/app/(admin)/discounts/page.tsx`
- `apps/web/src/app/(admin)/subscription/page.tsx`
- `apps/web/src/app/(admin)/store-settings/page.tsx`

## Files Created

- `apps/web/src/components/nk/` — all 12 primitive components
- `apps/web/src/app/(admin)/messages/page.tsx` — new page
- `apps/web/src/app/(admin)/messages/layout.tsx` if needed for full-height layout

## Out of Scope

- Settings page (`/settings`) — not in design scope
- Customers page — no backend customer CRUD endpoint
- Theme toggle UI (light/dark) — default light, can add later
- Density switcher — default balanced
