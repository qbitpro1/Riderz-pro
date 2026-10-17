# V0.4 plan: what to bring over from the current riderzpro.com repo

Source: github.com/Viswanath5177/Riderzpro (`main` plus every branch), checked 17 Oct 2026.
Target: this repo (qbitpro1/Riderz-pro), new branch `V0.4` from `main`.

## What was checked

- Their `main` (TanStack Start + Vite, SQLite/Postgres, a separate Python FastAPI server for logistics
  and the AI assistant, Capacitor and Flutter mobile shells).
- 25 branches. 19 are already merged into their `main`. Six hold work that is not:
  - `riderportal`: rider application, admin review and manual dispatch, earnings ledger.
  - `demo/muni-sankar`: GST invoice, order confirmation email, catalogue JSON.
  - `demo/hema`: deployment script, Postgres Docker Compose.
  - `feature/hima-quality`: QA notes.
  - `ui`: mock data on the landing page.
  - `vamsi-db-backup`: fully merged; nothing new.

## Direction (agreed 17 Oct)

This repo becomes the live riderzpro.com; their features come here, not the other way round. The live
site was deployed on 16 Oct only as a test and has **no real customers**, so no data moves. Old live
URLs that change get permanent redirects at switch-over.

## The live site (riderzpro.com), checked 17 Oct

It runs their `main` (the `riderportal` branch is not deployed: `/rider/apply` is 404).

- **Positioning differs from ours:** "EV batteries & parts that fit your bike". Departments: Electric
  Bikes, Batteries & Chargers, Spare Parts, Bike Accessories, Car Accessories, Riding Gear & Helmets.
  Bike picker by model and voltage (Ather 450X 48V, Ola S1 Pro 60V …) or by VIN.
- **Live data:** 0 products, 0 coupons, 2 test sellers (Bengaluru EV Spares Hub, Apex Power
  Solutions), 102 categories (car and bike accessory categories plus EV ones such as BMS).
- **Header:** delivery-location picker (shows "Indiranagar"), Shop, My Garage, Orders, Offers, Help,
  search, wishlist, cart, Sign in. Sign in did not open when clicked during the check.
- **Pages that load:** `/garage` (needs sign-in), `/orders`, `/offers`, `/support` (help-desk details
  and a ticket form), `/assistant` ("Volt" voice and text assistant with sample prompts), `/dashboards`
  (customer and admin workspaces), `/rider` (rider sign-in with email or phone and password),
  `/app` (mobile app view with hard-coded sample EV products and "30 min dispatch" badges).
- **Not working live:** `/track/demo` waits forever at "Connecting to Live Courier Telemetry" (the
  Python tracking server is not deployed); the shop and "Popular for your ride" are empty.
- **Also in their site, beyond the plan below:** a help-desk ticket form for customers, VIN lookup,
  a voice assistant, and a delivery-location picker in the header.

## Already done here (do not migrate)

- Homepage, shop, department and product pages, search, catalogue: ours are newer and better.
- Vendor portal and marketplace: migrated in V0.3 (stronger: KYC review, encrypted bank/PAN,
  server-priced orders, payouts, Offline Store).

## Their features, and what we do with each

| Feature in their repo | State there | Plan |
|---|---|---|
| Customer accounts: OTP login, profile, addresses, my orders, order detail | Working (Node, SQLite/PG) | **Port** (Phase 1) |
| Email OTP (Resend) and SMS OTP (Twilio) | Working, with dev fallback | **Port** (Phase 1); also gives sellers real OTP |
| Server-side garage and wishlist | Working | **Port** into our garage/wishlist (Phase 1) |
| Rider sign-up, status, admin review (`riderportal` branch) | Working, approval gated by a flag | **Port** (Phase 2) |
| Rider dashboard: assigned deliveries, pick-up / delivered steps, earnings | Working, manual dispatch | **Port** (Phase 2) |
| Admin dispatch: assign an order to a rider | Working on branch, not linked to checkout | **Port and link to our orders** (Phase 2) |
| Live rider GPS and customer tracking map (`/track/:id`) | Needs the Python server and WebSockets | **Rebuild in Next.js** (Phase 3) |
| Geofence (arriving / arrived) and route-deviation alerts | Python | **Rewrite in TypeScript** (Phase 3) |
| Road route and ETA (OSRM, haversine fallback), OSM/Leaflet map | Working | **Port** (Phase 3) |
| Delivery-location detection at checkout (GPS + reverse geocode) | Working (Nominatim) | **Port** (Phase 3) |
| Razorpay online payment | Stub: fake order id, amount taken from the browser | **Rebuild properly** (Phase 4) |
| Customer GST tax invoice, printable, plus confirmation email (`demo/muni-sankar`) | Working on branch | **Port** (Phase 4) |
| Coupons / offers page | Working API | **Port** (Phase 5) |
| Customer help-desk ticket form (`/support`) | Working | **Port**: reuse our support tickets table (Phase 1) |
| Delivery-location picker in the header | Working | **Port** with Phase 3 (shows whether rider delivery is available) |
| VIN lookup, bike picker by model and voltage | Working, EV two-wheelers | **Only if decision 0 adds the EV range** |
| Admin: team accounts, invites, roles, super admin, audit log | Working | **Port**, replacing our single Basic-auth login (Phase 5) |
| Admin: customers, reviews, warranty, notifications, payments, analytics screens | Mostly sample data, no real backend | **Build only the ones you want, on real data** (Phase 5) |
| Doorstep installation bookings / workshop dashboard | Partly mock | **Later, if wanted** (Phase 6) |
| AI shopping assistant | Separate Python service | **Later**: rebuild as a Next.js route on the Claude API (Phase 6) |
| Mobile apps (Capacitor shell, Flutter app) | Prototype | **Later**: wrap our site with Capacitor; rider app first (Phase 6) |
| "Quantum" QAOA rider assignment | Experimental | **Skip**: simple nearest-free-rider rule instead |
| EV battery fitment (make / model / year / voltage) | Their product focus | **Skip**: our fitment is cars |
| Python FastAPI server, `dev.db` files, landing-page mock data | Infrastructure | **Skip**: one Next.js app on Postgres |

## How it fits our stack

- Everything goes into this Next.js app and the same Postgres database (new migrations 004+). No
  second server.
- Live tracking uses short polling (every 5 to 10 s) or Server-Sent Events, not WebSockets, so it runs
  on normal serverless hosting. The rider's phone sends its location only while on an active
  delivery, after consent. We keep the latest point and a short trail and delete the trail after
  delivery (retention period to be agreed).
- Same rules as V0.3: identity from the session only, parameterised SQL, server-checked status moves,
  integer amounts, no secrets in the browser, Origin checks on writes.

## Phases

1. **Customer accounts.** OTP sign-in by mobile or email, profile, saved addresses, "My orders" with
   order detail, garage and wishlist saved to the account (guest checkout stays). Email/SMS provider
   adapter, which also replaces the console OTP for sellers.
2. **Riders.** `/rider` landing, apply (mobile OTP, city, vehicle, registration number), status page,
   admin review queue (approve / ask for correction / reject; approval off until policy is set),
   rider dashboard (offers, accept, picked up, delivered, earnings), admin dispatch of local orders
   to approved riders, earnings ledger.
3. **Live tracking.** Rider location while on a delivery; customer `/track/<order>` page with a map,
   moving rider marker, route line, ETA and milestone steps; "rider arriving" at 500 m and "arrived"
   at 50 m; off-route alert for dispatch; GPS address detection at checkout; the existing WhatsApp
   tracking stays for courier orders.
4. **Payments and invoices.** Razorpay: server creates the order from server prices, checkout,
   signature check, webhook, refunds. Customer GST tax invoice (printable) and confirmation email.
5. **Admin.** Team logins with roles and invites (replaces Basic auth), audit log, coupons, plus the
   chosen extra screens (customers, reviews, warranty, analytics) on real data.
6. **Later.** Installation bookings, AI assistant, mobile app shells.

Each phase: build on `V0.4`, scripted end-to-end checks, browser check, production build and
dealer-price scan, update `docs/WORK_UPDATE.md`, then push.

## Decisions needed from the owner

0. **EV and bike range.** The live site sells for two-wheeler EVs (batteries, chargers, BMS, spares,
   helmets); ours is car accessories. Keep ours car-only, or add EV/bike departments and a bike
   picker (model + voltage, VIN) alongside the car garage?
1. **Delivery area for our own riders.** Delhi NCR, matching the demo store? (Their rider work assumes
   Andhra Pradesh and Telangana.) Orders outside the area keep going by courier.
2. **Email/SMS provider** for login codes: Twilio, MSG91 or another, plus Resend (or another) for
   email.
3. **Razorpay** account and keys now, or later?
4. **Rider pay:** a fixed amount per delivery, or per km?
5. **Which extra admin screens** you want in Phase 5.
6. **Order of work:** start with Phase 1 (needed for "My orders" and tracking), or go straight to
   riders and tracking with order-number + phone lookup?
