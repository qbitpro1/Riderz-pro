# Riderzpro

Car accessories online at https://riderzpro.com. Riderzpro is a registered trademark of Motorbotz
Automotive Pvt. Ltd., which makes and sells the house range. The store carries the Riderzpro range plus
RECOIL, Blaupunkt and Autoform across eight departments, with fitment checks per car, installation at
the company's garages, and a marketplace of approved sellers who can also run an **Offline Store**
screen in their own shop.

## Current status (5 Nov 2026)

- `main` is complete and passes lint, typecheck and a production build.
- **Next step:** an internal test site, `test.riderzpro.com`, running `main`. It uses the production
  database from day one, because the first real sellers (Indus Enterprises) set up their portal there
  and keep that data on riderzpro.com. The team works against it while the go-live list below is
  finished.
- **Then:** riderzpro.com, after everything under [Before going live](#before-going-live-on-riderzprocom)
  is done.
- This repo replaces the old riderzpro.com (old repo `Viswanath5177/Riderzpro`, no real customers).

### What's new since V0.4 (Nov 2026)

- **Free AI, no API key needed.**
  - Ask AI on the website.
  - Salesman AI on the shop screen: Basic mode free; Full mode on Claude when a key is set.
- **Offline Store, run by the shop owner.**
  - Products show on the shop screen within seconds of saving. No Riderzpro review for the shop
    screen; the website still reviews them.
  - Shop categories and sub-categories that the seller makes (e.g. Mats → Autoform, GFX Pro).
    Indus Enterprises' 13 categories are set up.
  - "Bestseller" tag per category.
  - "Goes well with it" suggestions after something is added (car cover → mats), from both the
    screen and Salesman AI.
  - Sellers can delete any of their products; past orders keep their details.
- **Deployment audit fixes:**
  - Order lines keep their own GST rate, HSN and warranty.
  - Stock edits can't overwrite a newer stock count.
  - Rate limits on orders, shop-screen unlock and rider codes.
  - Admin CSV export locked to admins.
  - Fake ratings removed from search-engine data.
  - Copy fixes.
- **Phones:**
  - The seller portal and the shop screen work on a phone.
  - The seller's bottom bar has **My shop** (the Offline Store).
  - The product list, product form and category manager fit a small screen.

## What the site does

| Area | What | Where |
| --- | --- | --- |
| Shop | House catalogue, marketplace items, fitment by car (My Garage), wishlist, collections, search | `/shop`, `/products/[slug]`, `/sellers/[slug]` |
| Ask AI | Free shopping help over our own catalogue (Claude optional) | `/assistant` |
| Checkout | Server-priced orders; pay online (Razorpay) or order on WhatsApp; coupons; "Detect my location" | `/cart`, `/api/orders` |
| Customer accounts | Sign-in with a mobile/email code, orders with live tracking, GST invoices, addresses, help desk | `/account` |
| Sellers | Sign-up, KYC onboarding, products, stock, pricing, orders, invoices, payouts, notifications | `/vendor` |
| Offline Store | Shop-floor screen per seller: shop categories, Bestseller tags, suggestions, Salesman AI with seller-limited bargaining, pay on the screen or at the counter, receipts by SMS | `/store/[slug]`, set up in `/vendor/dashboard/store-screen` |
| Riders (Delhi NCR) | Apply, accept deliveries, share location, delivery codes, earnings | `/rider` |
| Admin | Team logins with roles; sellers, products, orders, refunds, payouts, dispatch, riders, coupons, customers, reports, audit log | `/admin` |
| Other | Services (PPF, audio, body kits…), used cars, the Mahindra BE 6 programme, offers | menus |

### Offline Store in short

- The seller opens their screen from the portal (**Offline Store → Open the screen**) on a tablet
  or TV in the shop.
- Customers browse by the seller's own categories, compare products and add them to an order.
- They pay by UPI on the screen or at the counter.
- Salesman AI answers questions in English or Hinglish, suggests products that go well together and
  can bargain within the limit the seller sets.
- The seller manages everything from the portal, on a phone too:
  - products and stock;
  - categories (Bestseller, suggestions);
  - shop details and today's offer;
  - payment options;
  - the unlock code.

## Before going live on riderzpro.com

Who does what is in [`docs/team/`](docs/team/README.md); the step-by-step deploy is
[`docs/DEPLOY.md`](docs/DEPLOY.md).

### Sign-in codes (OTP) and SMS

- [ ] Rotate the Resend API key and the Twilio auth token (both were shared in a chat).
- [ ] Choose the SMS provider (MSG91 recommended). The Twilio trial has no number and can't send.
- [ ] DLT registration (TRAI). Approval takes days, so start early:
  - register the company as an entity;
  - register a sender ID;
  - register one template each for the OTP, order confirmed, rider offer, rider arriving, rider
    arrived and shop receipt messages.
- [ ] Put the keys and template IDs in the host settings: `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`,
  `MSG91_TEMPLATE_*`.
- [ ] Without email or SMS, customer, rider and new-seller sign-in stays off. At least one must work.

### Email

- [ ] Verify riderzpro.com in Resend by adding its SPF and DKIM records to the DNS.
- [ ] Set `RESEND_API_KEY`, `OTP_EMAIL_FROM` and `ORDERS_EMAIL_FROM`.
- [ ] Confirm the support email and phone printed on emails and invoices.

### Payments and GST

- [ ] Razorpay:
  - test keys on the test site;
  - complete account activation (KYC);
  - live keys on production only.
- [ ] Razorpay webhook for each site, with the events listed in `docs/DEPLOY.md`.
- [ ] Check the GST invoice details (GSTIN, address, HSN rates) with the accountant.
- [ ] Decide commission on shop-screen sales paid at the counter. Today it is recorded, not charged.

### Database

**Client data entered on `test.riderzpro.com` is real.** The first sellers, starting with
Indus Enterprises, set up their portal and Offline Store there and must keep it on riderzpro.com from
day one. So the test site runs on the **production database** from its first day, and riderzpro.com
later points at the same database. The data lives in that database, not in git; nothing is
re-entered and nothing is wiped.

- [ ] One new, empty PostgreSQL database for test.riderzpro.com, kept as the production database.
  Use the pooled connection string; non-Neon/Supabase hosts need `?sslmode=require`.
- [ ] Daily backups with point-in-time restore on it from day one.
- [ ] Final `VENDOR_DATA_KEY` set from day one:
  - make it with `openssl rand -base64 32`;
  - save it in the password manager;
  - never change it (it locks sellers' bank details and PAN).
- [ ] Never reset this database. For experiments, use a separate throwaway database or a local copy.
- [ ] Set up Indus Enterprises in `/admin/vendors` with its real email and mobile and a strong
  password (not the local test password). The client enters their real business, KYC and bank details
  in the portal.
- [ ] Remove or archive the starter demo products the client doesn't sell (SKUs starting `DEMO-`).
- [ ] Orders placed with Razorpay test keys stay in the order history. Mark them clearly or cancel them
  before going live.

### Hosting and domain

- [ ] Hosting: Vercel recommended.
  - The hourly job needs the **Pro** plan.
  - On Hobby, set the job to daily and call `/api/cron/housekeeping` hourly from an uptime service.
- [ ] Settings on each site:
  - `NEXT_PUBLIC_SITE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD`, `CRON_SECRET`;
  - the keys above;
  - optionally `ANTHROPIC_API_KEY` and `SALESMAN_FULL_AI_SHOPS`.
- [ ] Uptime check on `/api/health`.
- [ ] Maps:
  - tile provider address (`NEXT_PUBLIC_MAP_TILES_URL`);
  - a contact email for OpenStreetMap services;
  - optionally an own routing server.
- [ ] Go-live day: point riderzpro.com and www at the new host, keep the email DNS records, and keep
  the old site on a spare address for a week.
- [ ] Run the smoke test in `docs/DEPLOY.md` on the test site, then on production right after the
  switch.

### Code still to do

- [ ] Keep search engines off the test site. Today `robots.txt` allows everything on every address.
- [ ] Indus Enterprises' 13 shop categories are only created if the seller already exists when the
  site first starts. On the new database the seller is added later, so setting up Indus must also
  create its categories (code change), or the client makes them in the portal.
- [ ] Owner decisions on content that isn't real yet:
  - testimonials, figures ("12,400+ builds", "4.8/5") and garage locations in Bengaluru, Hyderabad
    and Pune;
  - star ratings shown on house products;
  - 16 hard-coded used cars;
  - the dealer form on `/partners`, which doesn't save anything yet.
- [ ] Replace the Unsplash stock photos on the home page with our own.
- [ ] Merge `chore/zod-4` (zod 4 upgrade; clears the last high-severity `npm audit` item).
- [ ] Add a Content-Security-Policy header.
- [ ] Decide:
  - auto-cancelling old unpaid WhatsApp orders (today only quantity limits);
  - whether products rejected by admin should leave the shop screen.
- [ ] Not built yet, waiting on the owner:
  - header "Deliver to" picker;
  - reviews and warranty claims;
  - installation bookings;
  - mobile app.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (tokens in
  `src/app/globals.css`), zod, lucide-react, Leaflet.
- PostgreSQL through `DATABASE_URL` (`pg`). In development without it, an embedded PGlite database in
  `.data/pglite`.
  - Tables are created and upgraded on start (`src/lib/db/migrations.ts`, 001–018).
  - Migrations are append-only.
- External services, each switched on by its settings:
  - Razorpay;
  - Resend (email);
  - MSG91 or Twilio (SMS);
  - Anthropic Claude (optional AI);
  - OpenStreetMap services (maps, routes, addresses).

Next 16 differs from older versions (for example `src/proxy.ts` replaces `middleware`); check
`node_modules/next/dist/docs/` before using an API you are unsure of.

## Run

```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint       # keep at 0 problems
npm run typecheck
npm run build && npm start
```

No settings are needed in development:
- the embedded database is used;
- `/admin` is open when `ADMIN_USER` is unset;
- sign-in codes are printed in the server console;
- payments show as "not switched on";
- the free AI works.

Copy `.env.example` to `.env.local` to set anything; every setting is described there.

Before `npm run build`:
- stop the dev server (it locks the embedded database);
- delete `.next/dev`.

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

- `main` is what goes live. New work goes on its own branch and is merged when the owner says it's
  ready.
- Open branch: `chore/zod-4` (zod 4 upgrade, not merged yet).
- Versions are tagged:
  - `v0.2`: Riderzpro rebrand and accessories store;
  - `v0.3`: seller portal, marketplace, Offline Store;
  - `v0.4`: migration from the old riderzpro.com, covering:
    - accounts, riders and live tracking;
    - Razorpay and GST invoices;
    - coupons, admin team and reports;
    - AI and launch readiness.
- November 2026 work (free AI, owner-run Offline Store, deployment audit, phones) is on `main`.
- Detailed log up to 18 Oct 2026: `docs/WORK_UPDATE.md`.

## Docs

- [`docs/DEPLOY.md`](docs/DEPLOY.md): deployment runbook (settings, first deploy, cron, webhook, smoke
  test, rollback).
- [`docs/team/`](docs/team/README.md): what each team member must provide before launch.
- [`docs/VENDOR_PORTAL.md`](docs/VENDOR_PORTAL.md): the seller-side contract.
- [`docs/SHOPIFY_SETUP.md`](docs/SHOPIFY_SETUP.md): optional Shopify checkout (off; Razorpay is the
  checkout).
- [`docs/WORK_UPDATE.md`](docs/WORK_UPDATE.md): work log up to 18 Oct 2026.
