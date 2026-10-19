# Riderzpro

Car accessories online at https://riderzpro.com. Riderzpro is a registered trademark of Motorbotz
Automotive Pvt. Ltd., which makes and sells the house range. The store carries the Riderzpro range plus
RECOIL, Blaupunkt and Autoform across eight departments, with fitment checks per car and installation at
the company's garages, and a marketplace of approved third-party sellers.

## What the site does

| Area | What | Where |
| --- | --- | --- |
| Shop | House catalogue, marketplace items, fitment by car (My Garage), wishlist, collections, search | `/shop`, `/products/[slug]`, `/sellers/[slug]` |
| AI assistant | Free built-in shopping help over our own catalogue (Claude optional) | `/assistant` |
| Checkout | Server-priced orders; pay online (Razorpay) or order on WhatsApp; coupons; "Detect my location" | `/cart`, `/api/orders` |
| Customer accounts | Sign-in with a mobile/email code, orders with live tracking, GST invoices, addresses, help desk | `/account` |
| Sellers | Sign-up, KYC onboarding, products, stock, orders, invoices, payouts | `/vendor` |
| Offline Store | A shop-floor screen per seller: browse, AI salesperson with seller-limited bargaining, pay on the screen or at the counter | `/store/[slug]` |
| Riders (Delhi NCR) | Rider app: apply, accept deliveries, share location, delivery codes, earnings | `/rider` |
| Admin | Team logins with roles; sellers, products, orders, refunds, payouts, dispatch, riders, coupons, customers, reports, audit log | `/admin` |
| Other | Services (PPF, audio, body kits…), used cars, the Mahindra BE 6 programme, offers | menus |

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (tokens in
  `src/app/globals.css`), zod, lucide-react, Leaflet.
- PostgreSQL through `DATABASE_URL` (`pg`). In development without it, an embedded PGlite database in
  `.data/pglite`. Tables are created and upgraded on start (`src/lib/db/migrations.ts`, 001–011).
- External services, each switched on by its settings: Razorpay, Resend (email), MSG91 or Twilio (SMS),
  Anthropic Claude (AI assistants), OpenStreetMap services (maps, routes, addresses).

Next 16 differs from older versions (for example `src/proxy.ts` replaces `middleware`); check
`node_modules/next/dist/docs/` before using an API you are unsure of.

## Run

```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint       # ESLint (Next core-web-vitals + TypeScript): keep at 0 problems
npm run typecheck
npm run build && npm start
```

No settings are needed in development:
- the embedded database is used;
- `/admin` is open when `ADMIN_USER` is unset;
- sign-in codes are printed in the server console;
- payments and the AI show as "not switched on".

Copy `.env.example` to `.env.local` to set anything; every setting is described there.

Tests (scripted, no real money or messages):
- `node scripts/test-payments-signature.mjs`
- `node scripts/test-invoice.mjs`
- `node scripts/test-payments.mjs` (starts its own dev server on :3102 with a mock Razorpay)

## Architecture rules

- **Server is the source of truth for money.** Prices, totals, discounts and stock are worked out on
  the server; the browser only names products and quantities. Money is integer rupees (Razorpay
  amounts are paise, converted only at that boundary).
- **Identity from the session only.** Every API route checks its session and role:
  - `requireCustomer`, `requireVendor`, `requireRiderSession`;
  - `requireAdmin(perm)` / `adminPage(perm)` with the roles in `src/lib/admin/roles.ts`;
  - browser writes also pass `guardMutation` (Origin check).
- **Parameterised SQL only**, through `sql` / `sqlOne` / `transaction` (`src/lib/db/client.ts`); work in
  a transaction uses its own `q`.
- **Dealer prices and secrets never reach the browser.**
  - `src/lib/catalog`, `src/lib/store/products.ts`, `src/lib/search` and everything in
    `src/lib/server` are server-only.
  - Sellers' bank details and PAN are sealed with `VENDOR_DATA_KEY`.
- **Data in, data out:**
  - navigation, taxonomy, policies and site facts are data in `src/lib/data`;
  - client components use the shared hooks in `src/lib/client` (`useGarage`, `usePoll`,
    `useHydrated`, `useLatest`).
- **Themes:** token classes only (`bg-void`, `text-chalk`, `text-ash`, `text-accent`,
  `border-tint/N`); no raw colours in class names.
- **Housekeeping** (unpaid and uncollected orders, data retention, expired sessions) runs from
  `/api/cron/housekeeping` hourly, and after busy requests.

`docs/VENDOR_PORTAL.md` holds the detailed rules for the seller side (`src/app/vendor`, `src/app/store`,
`src/app/api/vendor`, `src/app/api/admin`, `src/lib/server`); read it before changing them.

## Branches and history

- `main`: what goes live. Work happens on a version branch and is merged when finished.
- V0.1 Motorbotz site → V0.2 Riderzpro rebrand and accessories store → V0.3 seller portal, marketplace,
  Offline Store → V0.4 migration from the old riderzpro.com:
  - customer accounts;
  - riders;
  - live tracking;
  - Razorpay;
  - GST invoices;
  - coupons;
  - admin team and reports;
  - AI assistants;
  - selling from the Offline Store;
  - full audit and launch readiness.
- Session-by-session log: `docs/WORK_UPDATE.md`.

## Docs

- [`docs/DEPLOY.md`](docs/DEPLOY.md): deployment runbook (settings, first deploy, cron, webhook, smoke
  test, rollback).
- [`docs/team/`](docs/team/README.md): what each team member must provide before launch.
- [`docs/AUDIT_V0.5.md`](docs/AUDIT_V0.5.md): the latest full audit and what was fixed.
- [`docs/VENDOR_PORTAL.md`](docs/VENDOR_PORTAL.md): the seller-side contract.
- [`docs/SHOPIFY_SETUP.md`](docs/SHOPIFY_SETUP.md): optional Shopify checkout (off; Razorpay is the
  checkout).
- [`docs/WORK_UPDATE.md`](docs/WORK_UPDATE.md): work log.
- [`docs/NEXT_SESSION.md`](docs/NEXT_SESSION.md): current state and what's next.
