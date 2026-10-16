# Vendor portal and marketplace (V0.3)

Approved sellers list car and bike accessories on Riderzpro alongside the
house range. This document is the contract every part of the portal is built
against. Read it before changing anything under `src/app/vendor`,
`src/app/store`, `src/app/admin/vendors*`, `src/app/api/vendor`,
`src/app/api/admin` or `src/lib/server`.

The design and flow follow the vendor portal of the earlier Riderzpro EV site
(`Viswanath5177/Riderzpro`, `main` branch, `VENDOR_NOTES.md`): sign-up, a
six-step KYC onboarding, a review status page, a seller dashboard, and admin
queues for sellers and products. That code kept everything in the visitor's
browser and had demo passwords and OTPs; none of its plumbing is used here.

## Architecture

| Concern | Where | Notes |
|---|---|---|
| Database | `src/lib/db/client.ts`, `src/lib/db/migrations.ts` | Postgres via `DATABASE_URL`. In development with no `DATABASE_URL`, an embedded Postgres (PGlite) in `.data/pglite`. Production refuses to start without `DATABASE_URL`. Parameterised SQL only (`sql`, `sqlOne`, `transaction`). |
| Shared types | `src/lib/vendor/types.ts` | Statuses, onboarding shape, product shape, order statuses and moves, settlement maths, URL helpers. Client-safe. |
| Validation | `src/lib/vendor/validators.ts` | zod schemas used by both the browser and the API; GSTIN checksum, PAN, IFSC, mobile, pincode. Client-safe. |
| Security | `src/lib/server/security.ts` | ids, scrypt passwords, OTP codes, AES-256-GCM sealing (`VENDOR_DATA_KEY`). |
| API conventions | `src/lib/server/http.ts` | `route()`, `ok()`, `ApiError`, `guardMutation()`, `readJson()`, `rateLimit()`, `adminActor()`. |
| Vendor sessions | `src/lib/server/session.ts` | HttpOnly cookie `rzp_vendor`; `currentVendor()`, `requireVendor(allow)`, `vendorPage(allow, here)`, `CAN_EDIT_ONBOARDING`, `CAN_SELL`. |
| Vendor rows, audit, notifications | `src/lib/server/vendors.ts` | `toVendorSelf`, `vendorById`, `publicVendorBySlug`, `audit()`, `notifyVendor()`. |
| Files | `src/lib/server/files.ts`, `/api/vendor/files`, `/api/files/[id]`, `/api/admin/files/[id]` | Stored in the database; type sniffed from bytes; documents never public. |
| One-time codes | `src/lib/server/otp.ts` | Dev prints codes to the server console. Production has no provider yet (`otpDeliveryAvailable` is false) — contact details are verified by the admin team during KYC. |
| Vendor products | `src/lib/server/vendor-products.ts` | Row mapping and the **visibility gate** `LIVE_PRODUCT_WHERE` / `isOnSale`. |
| Browser fetch | `src/lib/vendor/client.ts` | `api()`, `uploadFile()`, `ApiFailure` (with `fields` for form errors). |

### Rules (non-negotiable)

1. **Identity comes from the session, never from the request.** No route accepts a
   `vendorId`, `status`, `commissionRate`, `approvedBy` or similar from the body or URL
   for the caller's own account. Vendors act only on rows where `vendor_id` = their id.
2. **Every mutating route** starts with `guardMutation(req)` and parses its body with a
   zod schema via `readJson`. Wrap handlers in `route()`; throw `ApiError` for expected
   failures. Never return raw error text.
3. **State transitions are checked on the server.** A vendor can never approve itself or
   its products. Vendor product status moves: `draft → pending_review` (vendor submits),
   `pending_review → live | changes_requested | rejected` (admin only),
   `changes_requested → pending_review` (vendor resubmits), `live → archived` and
   `archived → draft` (vendor). Content edits on a live product go to `pending_revision`
   and stay off the shop until an admin approves them; price/stock/SKU edits apply at once.
4. **Vendor account moves:** `draft → submitted` (vendor, all six steps complete),
   `submitted → under_review` (admin opens it), `under_review|submitted → approved |
   changes_requested | rejected` (admin), `changes_requested → submitted` (vendor),
   `approved → suspended` and `suspended → approved` (admin). Approval sets
   `commission_rate`, `tier`, `approved_at`, `approved_by`.
5. **Products, stock, pricing and orders** need `vendor.status === "approved"`
   (`requireVendor(CAN_SELL)`). A suspended vendor can sign in but not change anything,
   and their products leave the shop at once (the visibility gate checks the vendor).
6. **Admin routes** live under `/api/admin/*` and admin pages under `/admin/*`; both are
   behind HTTP Basic auth in `src/proxy.ts`. Record the admin with `adminActor(req)`.
   Every admin decision writes `audit()` and, where the vendor is affected, `notifyVendor()`.
7. **Secrets:** bank account number and PAN are stored only sealed (`seal()`) with the
   last four in clear. They are never sent to the browser except: the full bank number
   to an admin who presses "Reveal", which is audited.
8. **Money** is integer rupees, GST inclusive. Settlement per delivered vendor order:
   `settlementFor(subtotal, commissionRate)` (commission, 18% GST on commission, net).
9. **Dealer prices** (`dp` in the RECOIL/Autoform data) remain server-only exactly as
   before; nothing in the vendor portal may import the house catalogue internals into a
   client component.
10. **Theme:** use the site's tokens and utilities (`card`, `btn btn-primary`,
    `btn-outline`, `btn-sm`, `field`, `label`, `eyebrow`, `chip`, `display-2/3`,
    `section`, `shell`; colours `void/carbon/steel/graphite/slate`, `chalk/ash/dim`,
    `accent`, `tint/N`, `gold`, `danger`). Never `white/N`, `black/N`, `gray-*`, hex or
    rgba in class names. Icons: `lucide-react` is available for portal UI.

## URLs

| Who | URL | What |
|---|---|---|
| Public | `/vendor` | "Sell on Riderzpro" landing |
| Public | `/vendor/auth` | Sign in / sign up / reset password |
| Vendor | `/vendor/onboarding` | Six steps (draft, changes requested) |
| Vendor | `/vendor/pending` | Review status, timeline, what happens next |
| Vendor | `/vendor/dashboard` | Overview |
| Vendor | `/vendor/dashboard/products` (`/new`, `/[id]`) | Catalogue, add / edit |
| Vendor | `/vendor/dashboard/inventory`, `/pricing` | Stock, price |
| Vendor | `/vendor/dashboard/orders` (`/[id]`) | Orders, packing slip / invoice |
| Vendor | `/vendor/dashboard/payments` | Settlements, payouts |
| Vendor | `/vendor/dashboard/settings`, `/notifications`, `/support` | Store profile, holiday mode, bank change, alerts, tickets |
| Admin | `/admin/vendors` (`/[id]`) | KYC queue and decisions |
| Admin | `/admin/vendor-products` | Product approval queue |
| Admin | `/admin/orders`, `/admin/payouts`, `/admin/support` | Orders, payouts, seller tickets |
| Shopper | `/store/[slug]`, `/store/[slug]/[product]` | Storefront, vendor product page |

## Environment

| Name | Needed | Purpose |
|---|---|---|
| `DATABASE_URL` | production | Postgres connection string (Neon, Supabase, RDS, own server). |
| `VENDOR_DATA_KEY` | production | 32 random bytes, base64 (`openssl rand -base64 32`). Seals bank/PAN. Losing it makes stored bank details unreadable. |
| `ADMIN_USER`, `ADMIN_PASSWORD` | production | Already required for `/admin`; now also protect `/api/admin`. |
| `OTP_EMAIL_PROVIDER`, `OTP_SMS_PROVIDER` | later | Turn on code delivery once a provider is wired in `src/lib/server/otp.ts`. |

## Status (16 Oct 2026, end of session 1)

All five parts are built and merged on `V0.3` (not pushed). Verified end to end on the
local site against the embedded database: sign-up, email/mobile codes, uploads (fake
image rejected), six onboarding steps (bad GSTIN and reserved slug rejected, bank number
never returned), submit, admin start review, reveal (reason required, audited), approve
(stale second approve refused), product create → submit → admin approve → live in
`/shop/interior`, `/store/<slug>` and its product page; order of a seller product plus a
house product (stock 5 → 3, over-stock refused), seller accept → pack → ship (courier and
tracking required) → deliver, GST invoice (CGST/SGST, GSTIN, invoice number), payout held in
the 7-day window (net ₹13,228 on ₹14,998 at 10%), early admin payout refused, suspend →
product leaves the shop and edits blocked → reinstate. All 22 portal and admin pages return 200.

### Next session — in this order
1. **Site chrome on the seller dashboard:** hide the site Footer, BottomNav and WhatsApp button
   on `/vendor/dashboard/*` (root layout renders them on every route; the dashboard bottom nav
   overlaps the site's on phones).
2. **Accessibility:** on `/vendor/auth` the sign-in field's accessible name is its placeholder,
   not the "Email or mobile" label — associate labels with inputs (check every form in
   `src/components/vendor/auth/fields.tsx` and the onboarding steps).
3. **Message wording:** `requireVendor` says "available once approved" to a vendor whose
   application is submitted/under review — give a status-specific message.
4. **Migration 002:** partial unique index `vendor_change_requests (vendor_id) WHERE status = 'pending'`.
5. **Not yet exercised:** request changes → vendor fixes only flagged steps → resubmit; product
   request changes / reject / revision approve and discard; bulk approve; bank change request →
   admin approve; support ticket → reply; password change; holiday mode; inventory/pricing bulk
   saves; CSV exports; returns (return requested → returned, restock, payout exclusion); admin
   payout after the window (set `delivered_at` back 8 days); house-only order confirm/complete;
   checkout form in the browser (WhatsApp hand-off and the 503 fallback).
6. **Visual pass** at 360 px and 1280 px in light and dark on every portal/admin page; seller
   items sit after the house items in shop listings (consider a "Marketplace" sort/filter).
7. `npm run build`, dealer-price scan, then push `V0.3`.
8. **Owner decisions before launch:** Postgres provider (`DATABASE_URL`), `VENDOR_DATA_KEY`,
   `ADMIN_USER`/`ADMIN_PASSWORD`, an OTP provider (email/SMS), commission defaults, seller terms
   page content, and whether uploads move to object storage later.
