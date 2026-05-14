# Findings & Research — Nepthok

> Last updated: 2026-05-14

---

## Payment Gateways

### eSewa

- **Type:** Nepali digital wallet & payment gateway
- **Website:** esewa.com.np
- **Integration method:** Server-side redirect + webhook callback
- **Test environment:** Available (test credentials required)
- **Currency:** NPR
- **Key notes:**
  - Requires merchant registration and approval
  - Payment flow: frontend initiates → eSewa checkout page → redirect back with payment token → server verifies token with eSewa API
  - Webhook signature must be validated server-side
  - Refunds are handled manually or via dashboard in early versions

### Khalti

- **Type:** Nepali digital wallet & payment gateway
- **Website:** khalti.com
- **Integration method:** Khalti Checkout SDK (frontend) + server-side verification
- **Test environment:** Available (sandbox keys from Khalti dashboard)
- **Currency:** NPR
- **Key notes:**
  - Khalti provides a JS SDK for the browser checkout widget
  - After user completes payment in widget, server must call Khalti's verify API with the token
  - Has a more modern REST API than eSewa; better documentation
  - Supports UPI, bank transfer, and wallet in one checkout

---

## Hosting

### DigitalOcean

- **Chosen platform:** DigitalOcean
- **Reasons:** Cost-effective for a Nepal-based startup; good Droplet pricing; App Platform for managed deployments
- **Options under consideration:**
  - **Droplets (VPS):** Full control, cheapest, requires Docker + Nginx setup
  - **App Platform:** Managed containers, auto-scaling, simpler CI/CD — higher cost
  - **Managed PostgreSQL:** DigitalOcean managed DB for production; eliminates self-managing Postgres
- **Region:** Singapore (`sgp1`) — lowest latency for Nepal
- **Notes:**
  - Will need a `.env`-based secrets strategy compatible with DigitalOcean App Platform env vars
  - Static assets / media uploads: DigitalOcean Spaces (S3-compatible) is the natural choice
  - Decide Droplet vs App Platform before Phase 8

---

## External APIs

### SMS Messaging

- **Status:** To be documented
- **Options to evaluate:**
  - **Sparrow SMS** — popular in Nepal; REST API; affordable per-SMS pricing
  - **Aakash SMS** — alternative Nepali SMS provider
  - **Twilio** — international; more expensive for Nepal numbers; good reliability
- **Required use cases:**
  - Order confirmation to buyer (phone number)
  - New order alert to tenant
- **Notes:**
  - Evaluate Sparrow SMS first (most widely used by Nepali SaaS products)
  - Need to confirm DLT registration requirements for transactional SMS in Nepal
  - Document API keys, rate limits, and pricing before Phase 7

---

## Constraints

| Constraint | Detail |
|---|---|
| Currency | NPR (Nepali Rupee) only at launch |
| Payment gateways | eSewa + Khalti only (no international cards at launch) |
| Language | English UI at launch; Nepali (Devanagari) localization as a follow-up |
| Phone numbers | Nepal format (+977 country code) required for SMS |
| Hosting region | Singapore (sgp1) for DigitalOcean |
| Minimum Node.js version | 18.x |
| Database | PostgreSQL 15+ |
