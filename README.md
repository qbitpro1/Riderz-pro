# Riderzpro

Car accessories online at https://riderzpro.com. Riderzpro is a registered trademark of Motorbotz
Automotive Pvt. Ltd., which makes and sells the house range. The store carries the Riderzpro range plus
RECOIL, Blaupunkt and Autoform across eight departments, with fitment checks per car and installation at
the company's garages.

**Business model (decided 9 Nov 2026):**
- **The website sells Riderzpro's own catalogue.**
- **Sellers can also list products to sell on the website, but only after Riderzpro's admin approves
  them.** Only approved ("live") products of approved sellers reach website users (shop, seller pages,
  search, Ask AI, sitemap, online checkout). Edits to a live product's details wait for review; the
  website keeps the approved version meanwhile.
- **The Offline Store is the seller's own shop screen**, signed in through their seller account. It
  shows all their products straight away, with no Riderzpro review (except products admin rejected).
  It is an add-on that makes in-shop sales easier; Riderzpro will charge sellers a **monthly fee** for
  it in future (billing not built yet).

## Current status (9 Nov 2026)

- **Live:** riderzpro.com runs the `old-deploy` branch on the team's Ubuntu server behind nginx
  (runbook: `docs/DEPLOY.md`, sections 6–10). Data on the live site is real: the first sellers,
  starting with Indus Enterprises, keep what they enter there. Never reset that database.
- **`main` is ahead of the live site.** On 9 Nov it took in the live branch, Sathwik's payments and
  deploy work and Harshitha's seller-portal work (see below), and was audited:
  - typecheck, lint and production build pass;
  - all 475 pages load with no server errors;
  - test scripts pass: payments 29/29, invoices 22/22, payment signatures 18/18, SMS/OTP 18/18;
  - seller, shop-screen, customer and admin journeys tested in a browser.
- **Next release:** Sathwik moves `old-deploy` up to `main` once Razorpay test keys work on the
  server (from then on checkout is online-only), then redeploys and runs the smoke test.
- **Not merged yet:** Sathese's `customer-site-updates` (needs changes, see "Code still to do") and
  Vamsi's PR #3 (waits for an owner decision).
- This repo replaces the old riderzpro.com (old repo `Viswanath5177/Riderzpro`, no real customers).

### What's new in November 2026

- **Free AI, no API key needed.**
  - Ask AI on the website.
  - Salesman AI on the shop screen: Basic mode free; Full mode on Claude when a key is set.
- **Offline Store, run by the shop owner.**
  - Products show on the shop screen within seconds of saving. No Riderzpro review for the shop
    screen; products rejected by admin are hidden from it and can't be bought.
  - Shop categories and sub-categories that the seller makes (e.g. Mats → Autoform, GFX Pro).
    Indus Enterprises gets its 14 categories automatically when approved or set up.
  - "Bestseller" tag per category; "goes well with it" suggestions on the screen and from Salesman AI.
  - Sellers can delete any of their products; past orders keep their details.
  - Search looks in all categories.
- **Salesman AI.**
  - A seller can set a **lowest price** per product; bargaining never goes below it.
  - Basic mode understands Hinglish, vague and price-complaint questions, "what goes with it?" and
    "compare the two".
  - Mic in Salesman AI and search. Without browser speech recognition (e.g. the Jio TV box) it records
    and turns speech into text on the server through Sarvam AI (`SPEECH_TO_TEXT_PROVIDER=sarvam`,
    `SARVAM_API_KEY`); off until a key is set. The mic needs the https address.
- **Screens.**
  - Phones: seller portal and shop screen; the seller's bottom bar has **My shop**.
  - 32-inch shop TVs (browsers reporting 960×540): welcome, browse, product page, order, checkout,
    review, compare and dialogs all fit. The shop screen also works over the shop's Wi-Fi.
- **Checkout and money.**
  - **Online payment only** (Razorpay). WhatsApp ordering is gone from checkout and the server.
  - **No commission on Offline Store screen sales**, including older unpaid ones (migration 019).
  - Order lines keep their own GST rate, HSN and warranty.
- **Sign-in codes, SMS and email.** MSG91, Twilio and Resend are separate modules; MSG91 errors that
  answer "200" are caught; a code that fails to send is cancelled at once; start-up warns about DLT
  templates still missing.
- **Security.** Content-Security-Policy header (report-only for now, `CSP_MODE`), zod 4, rate limits on
  orders, shop-screen unlock and rider codes, admin CSV export locked to admins.

## What the site does

| Area | What | Where |
| --- | --- | --- |
| Shop | House catalogue, marketplace items, fitment by car (My Garage), wishlist, collections, search | `/shop`, `/products/[slug]`, `/sellers/[slug]` |
| Ask AI | Free shopping help over our own catalogue (Claude optional) | `/assistant` |
| Checkout | Server-priced orders; online payment only (Razorpay); coupons; "Detect my location" | `/cart`, `/api/orders` |
| Customer accounts | Sign-in with a mobile/email code, orders with live tracking, GST invoices, addresses, help desk | `/account` |
| Sellers | Sign-up, KYC onboarding, products, stock, pricing, orders, invoices, payouts, notifications; listings go on the website after admin approval, and on their Offline Store straight away | `/vendor` |
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
  can bargain within the limit the seller sets, never below a product's lowest price.
- The seller manages everything from the portal, on a phone too:
  - products and stock;
  - categories (Bestseller, suggestions);
  - shop details and today's offer;
  - payment options;
  - the unlock code.

## Before customers can order on riderzpro.com

The task list per person is kept with the team (latest: task update of 9 Nov 2026). Deploy steps:
[`docs/DEPLOY.md`](docs/DEPLOY.md).

### Sign-in codes (OTP), SMS and email (Amrutha)

- [x] Code: MSG91/Resend/Twilio modules, error handling, cancel undelivered codes, test suite.
- [ ] Rotate the Resend API key and the Twilio auth token (both were shared in a chat).
- [ ] MSG91 account and `MSG91_AUTH_KEY`.
- [ ] DLT registration (TRAI): company, sender ID, one template each for OTP, order confirmed, rider
  offer, rider arriving, rider arrived and shop receipt. Waiting for approval.
- [ ] Resend: verify riderzpro.com (SPF/DKIM), set `OTP_EMAIL_FROM` and `ORDERS_EMAIL_FROM`.
- [ ] Keys and template IDs to Sathwik for the server (password manager only).
- [ ] Confirm the support email and phone printed on emails and invoices.

### Payments and GST (Sathwik)

- [x] Online-only checkout and zero commission on shop-screen sales (on `main`).
- [ ] Razorpay: test keys and webhook on the server, account activation (KYC), live keys at go-live.
- [ ] Real payment test: card and UPI, order turns Paid, invoice opens, refund ₹1.
- [ ] GST invoice details (GSTIN, HSN rates) checked with the accountant.
- [ ] **Registered office address** for GST invoices and the Contact page: to be shared by the owner.

### Server (Sathwik)

- [ ] Move `old-deploy` up to `main` and redeploy (after Razorpay test keys work).
- [ ] Settings: keep the current `VENDOR_DATA_KEY` (a new key would make saved bank details unreadable),
  `ADMIN_USER`, `ADMIN_PASSWORD`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, the keys above; optionally
  `ANTHROPIC_API_KEY`, `SALESMAN_FULL_AI_SHOPS`, `SPEECH_TO_TEXT_PROVIDER` + `SARVAM_API_KEY`.
- [ ] The server must run in production mode (`npm run build` then `npm start`): in development the
  sign-in code is shown in the browser.
- [ ] nginx: real visitor IP (`X-Real-IP`) and a 5 MB upload limit; hourly cleanup cron; uptime
  check on `/api/health` (runbook sections 7, 8, 10).
- [ ] After a week of report-only with no reports, set `CSP_MODE=enforce` and rebuild.

### Database and catalogue (Muni Shankar, Vamsi)

- [ ] Confirm which PostgreSQL the live site uses; daily backups with point-in-time restore and one
  test restore.
- [ ] Save the current `VENDOR_DATA_KEY` in the password manager.
- [ ] Indus Enterprises' real catalogue in the live database, filed into its shop categories; then
  remove the `DEMO-` sample products once.
- [ ] Home page photos stored in our own files table instead of loading from Unsplash.
- [ ] Cancel or mark test orders before the public launch.

### Code still to do

- [ ] **Sathese (`customer-site-updates`)**: update to `main` and open a PR into `main`:
  - keep `main`'s online-only checkout (remove "place order and pay later") and drop the duplicate
    zod 4 change;
  - Google Translate in the language menu: **approved**; add a line about it to the privacy policy;
  - invoices keep an address until the registered office address is shared.
- [ ] **Vamsi (PR #3, database catalogue)**: the direction is agreed, but the branch is not complete
  yet, so it is not merged. It moves the shop to products stored in the database (JSON catalogue
  upload, admin approval), adds account carts and a `DATABASE_SCHEMA` option. Before merging: finish
  it, update it to `main` (5 small conflicts today), run `npm run build` and the test scripts, and
  decide how Indus's `DEMO-` sample products are removed (today the branch deletes them on every
  start-up).
- [ ] Later: monthly Offline Store subscription for sellers (plans, billing, what happens when unpaid).
- [ ] **Hima Bindu**: `/partners` dealer form (saves nothing today), remove used cars and "sell your car"
  (`/used-cars`, `/cars`, `/sell`, EMI calculator, links, sitemap), remove WhatsApp from admin and
  other pages, admin panel test.
- [ ] **Harshitha**: Indus go-live with real KYC; Salesman AI bundle offers (free fitting, add-on
  discounts), its log and test conversations; test the shop TV mic on the https site.
- [ ] Demo content still on `main` until those branches land: garage locations, "12,400+ builds",
  WhatsApp buttons outside checkout.
- [ ] Delete the old `chore/zod-4` branch (zod 4 is on `main`).
- [ ] Not built yet: header "Deliver to" picker, reviews and warranty claims, installation bookings,
  mobile app.

### Owner decisions

- [x] Google Translate on the customer site: **yes**.
- [ ] Registered office address: to be shared.
- [x] Website = Riderzpro's own catalogue plus seller listings approved by Riderzpro's admin; the
  seller's Offline Store shows their products straight away; the Offline Store becomes a paid monthly
  add-on later.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (tokens in
  `src/app/globals.css`), zod, lucide-react, Leaflet.
- PostgreSQL through `DATABASE_URL` (`pg`). In development without it, an embedded PGlite database in
  `.data/pglite`.
  - Tables are created and upgraded on start (`src/lib/db/migrations.ts`, 001–019).
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

Before `npm run build` (it uses webpack, `next build --webpack`):
- stop the dev server (it locks the embedded database);
- after a build, delete `.next` before `npm run dev` again, or the dev styles can be stale.

Import zod from `@/lib/zod`, not from `"zod"` (zod 4 with the old messages). After merging anything
that changes `package.json`, run `npm install` and commit the updated `package-lock.json`.

Tests (scripted, no real money or messages):
- `node scripts/test-payments-signature.mjs`
- `node scripts/test-invoice.mjs`
- `node scripts/test-payments.mjs` (starts its own dev server on :3102 with a mock Razorpay)
- `node scripts/test-otp-sms-notifications.mjs`

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

- `main`: development. **Start every task from `main` and open a Pull Request into `main`:**
  `git fetch origin && git checkout -b <your-name>/<task> origin/main`. One teammate reviews it before
  it is merged. Nobody pushes straight to `main` or `old-deploy`.
- `old-deploy`: **the live site.** For each release, Sathwik moves it up to `main` and redeploys.
  Never delete it. Tag `old-deploy-2026-11-05` marks where it started.
- Open team branches (9 Nov 2026): `customer-site-updates` (Sathese), `vamsi` (PR #3, not complete
  yet),
  `sathwik/deploy-and-payments` and `harshitha/seller-portal-tasks` (both already merged into `main`;
  close PR #2 without merging it into `old-deploy`: it lacks a shop-checkout fix that is on `main`).
- Versions are tagged:
  - `v0.2`: Riderzpro rebrand and accessories store;
  - `v0.3`: seller portal, marketplace, Offline Store;
  - `v0.4`: migration from the old riderzpro.com, covering:
    - accounts, riders and live tracking;
    - Razorpay and GST invoices;
    - coupons, admin team and reports;
    - AI and launch readiness.
- Detailed log up to 18 Oct 2026: `docs/WORK_UPDATE.md`.

## Docs

- [`docs/DEPLOY.md`](docs/DEPLOY.md): deployment runbook (settings, first deploy, cron, webhook, smoke
  test, rollback).
- [`docs/team/`](docs/team/README.md): what each team member must provide before launch.
- [`docs/VENDOR_PORTAL.md`](docs/VENDOR_PORTAL.md): the seller-side contract.
- [`docs/SHOPIFY_SETUP.md`](docs/SHOPIFY_SETUP.md): optional Shopify checkout (off; Razorpay is the
  checkout).
- [`docs/WORK_UPDATE.md`](docs/WORK_UPDATE.md): work log up to 18 Oct 2026.
