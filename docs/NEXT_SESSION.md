# Next session: where we are and what's next (written 17 Oct 2026)

## State

- Repo `qbitpro1/Riderz-pro`. Work branch `V0.4`; `main` = `V0.4` at `fe54e72` (merged 17 Oct 2026).
- This repo becomes the live riderzpro.com (car accessories only). The old site (repo
  `Viswanath5177/Riderzpro`, TanStack + Python) is being replaced; it has no real customers.
- Done and on `main`:
  - V0.3: seller portal, marketplace, Offline Store screen (voice search, Qubo dashcams,
    blue tick, side-by-side compare).
  - Phase 1: customer accounts.
  - Phase 2: riders (Delhi NCR).
  - Audit fixes (`docs/AUDIT_V0.4.md`).
- Plan of phases: `docs/MIGRATION_PLAN_V0.4.md`. Running log: `docs/WORK_UPDATE.md`.

## Owner's instructions for the next session (17 Oct 2026)

- Read this file, then build **Phase 3 (live tracking) in full first, then Phase 4 (payments)**.
- The team is on leave until Monday 19 Oct 2026; the migration work is done today (17 Oct) without them. Don't stop for missing keys or IDs: build with test settings and
  placeholders, and write each missing item into that person's file in `docs/team/`:
  - billing, Razorpay, GST invoice: `Sathwik_work.md`
  - database: `Vamsi_work.md`
  - Twilio, OTP, SMS, email: `Amrutha_work.md`
  - maps, routing, geocoding: `Viswanath_work.md`
  - hosting and domain: `Hosting_work.md` (person not yet assigned)
  - any other area: a new `<Name>_work.md` (or `<Area>_work.md` if no person is known), listed in
    `docs/team/README.md`.
- Phase 3 has not been started (no location code or tables yet). Note: `/track/:id` currently
  permanently redirects to `/account/orders`, so put the tracking map on `/account/orders/[number]`.

## Waiting on the owner (details in `docs/team/`)

1. Email test: which address to send a real sign-in code to (Resend key works, send-only;
   sender `entangle@silicofeller-quantum.com` must be verified in Resend).
2. A new, empty PostgreSQL database URL for this site. Not the old site's database: the table names
   clash (orders, order_items, customers, customer_addresses, support_tickets).
3. SMS: Twilio is a trial account with no number (`TWILIO_FROM` empty), so riders and mobile sign-in
   only get console codes. Options: a Twilio number, or MSG91 (DLT template) for India.
4. Razorpay test keys (`rzp_test_…`) for Phase 4, as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
5. Hosting settings for go-live: `DATABASE_URL`, `VENDOR_DATA_KEY`, `ADMIN_USER` / `ADMIN_PASSWORD`,
   email/SMS keys. Then switch the domain and refresh the demo store from `/admin/vendors`.

## Next to build (order set by the owner)

1. **Phase 3: live tracking.**
   - Rider location only while on a delivery, with consent; short trail, deleted after delivery.
   - Customer order page: map (Leaflet + OpenStreetMap), moving rider, route and ETA (OSRM with a
     straight-line fallback).
   - Alerts: "arriving" at 500 m and "arrived" at 50 m; off-route alert for dispatch.
   - "Detect my location" at checkout.
   - Polling, not WebSockets (serverless hosting).
2. **Phase 4: online payments (Razorpay).**
   - Server-priced Razorpay order, Checkout on the cart page, signature check, webhook, refunds.
   - Customer GST tax invoice (printable) and order confirmation email.
   - WhatsApp ordering stays as an option.
3. **Phase 5: admin.**
   - Team logins with roles and invites (replacing Basic auth), audit log viewer, coupons.
   - Chosen extra screens: customers, reviews, warranty, reports.
4. **Later.** Installation bookings, AI assistant (Claude API), mobile app shell (rider app first).

## Choices made without the owner (change if asked)

- Rider area: Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, Faridabad.
- Rider pay: a fixed amount per delivery, set per job by the admin (default ₹60).
- Only seller parts go to riders (Riderzpro's own items need a Delhi pickup address first).
- Guest orders join an account only by the verified mobile (never email).

## Local setup on this computer

- `.env.local` (git-ignored) holds the Resend and Twilio keys and `OTP_SEND_IN_DEV=true`. No
  `DATABASE_URL`, so the embedded database in `.data/pglite` is used.
- Local test data: demo seller `indus@riderzpro.com` / `12345` (Indus Enterprises, 21 products incl.
  9 Qubo dashcams); customer Ravi Kumar 9123456780; riders Saroj 9811111111 and Raju Singh
  9822222222. Development codes print in the dev-server console.
- Run with the "riderzpro" launch config (port 3000).
- Stop the dev server before `next build`; after a build, delete `.next/dev` or the dev server can
  serve stale CSS.
- The dev server locks `.data/pglite`, so stop it before scripts that open the database.

## Every change

- Type check, production build (533 pages), dealer-price scan of `.next`, sitemap crawl (all 200).
- Browser check, update `docs/WORK_UPDATE.md`, commit, push `V0.4`; merge to `main` when the owner
  asks.
