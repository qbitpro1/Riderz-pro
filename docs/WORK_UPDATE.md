# Work update

## 18 Oct 2026: AI shopping assistant, and selling from the Offline Store screen (on V0.4)

- **Website AI assistant**:
  - Pages: `/assistant`, also reached from the search box ("Ask the AI assistant about …"), the
    footer and the sitemap.
  - Runs on the Claude API, with our own tools only: search the catalogue (Riderzpro's products +
    approved sellers), product details, find a car, current offers, show product cards (with Add
    to cart).
  - Uses the shopper's garage car. The system prompt holds the store facts (delivery, returns,
    fitment guarantee, payment, WhatsApp). It never invents products or prices and treats product
    text as data.
  - Limits: 20 questions per 10 minutes per visitor, 120 a day, 3,000 a day in all.
- **Shop screen AI salesperson** (Offline Store):
  - "Ask AI" in the header, "Ask AI about …" in search, and in the "nothing matches" state; voice
    or typing.
  - Knows only that seller's live, in-stock products. It asks about the car, needs and budget,
    recommends and compares, adds to the order, and opens checkout.
  - **Bargaining**:
    - Only if the seller turns it on, within the seller's limits (most % off and most ₹ off one
      order).
    - The AI starts small and goes up in steps, and never reveals the limit.
    - The server refuses any offer above the limit and checks it again at checkout; an offer
      lasts 20 minutes and is used once.
- **Selling from the screen**:
  - "Checkout and pay" in the order: name + mobile, then pay on the screen (Razorpay UPI/card,
    when keys are set) or pay at the counter.
  - A big order number is shown at the end.
  - The order is in the seller's dashboard; staff press "Paid and handed over" (counter) or
    "Handed over" (paid on screen).
  - Counter orders not collected in 12 hours are cancelled and the stock goes back.
  - Counter sales are never paid out to the seller again (`collected_by = seller`).
  - The special price lowers the seller's item prices on the order, so the invoice, commission
    and payout follow the price paid.
- **Seller settings**: `/vendor/dashboard/store-screen` (linked from the Offline Store card):
  - AI on/off, bargaining on/off, most % (0–30) and ₹ off.
  - Pay on screen / at the counter.
- **Database**: migration 011 (store_settings, store_offers, vendor_orders.collected_by, payment
  method "counter").
- **Verified** (Claude replaced by a local stand-in that uses the tools like the model; no real key,
  no cost):
  - 31 scripted checks:
    - website answers with real product cards; off-topic answered without cards; cross-site
      blocked; rate limit
    - shop assistant needs the seller session; finds stock and adds to the order
    - no discount tool while bargaining is off; 50% refused by the server; 2% agreed with the
      right maths
    - AI opens checkout; bad mobile refused; pay on screen refused without Razorpay keys
    - counter order with the special price; the offer can't be reused; over-stock refused
    - the order is in the seller's list; paid-and-handed-over once only
    - settings can't be changed while the screen is locked
  - Browser walk-through on the shop screen: ask → cards → added → "give me a discount" → 2%
    special price → checkout with the price → order RZP-MN5MRJ ₹6,851 → Done resets the screen.
  - Website assistant page from a search; phone width fine.
  - All 461 pages load; build clean; no dealer prices or secrets in built files.
- **Not tried for real yet**: the real Claude model (needs `ANTHROPIC_API_KEY`), and paying on the
  screen (needs Razorpay keys).

## 17 Oct 2026 (night, later): Phase 5 part 3, admin Customers and Reports (on V0.4)

- **`/admin/customers`**:
  - Shopper accounts with search (name, mobile, email), orders, money spent and last order.
  - Each customer's page: verified contacts, car, sign-in, wishlist count, saved addresses,
    orders (linked to the admin order) and messages.
  - Read only. New "customers" permission: Owner, Manager, Operations, Support.
- **`/admin/reports`**: a date range (India dates; presets for today, 7, 30 and 90 days):
  - Sales, average order, Riderzpro's own items vs marketplace items, delivery charged, coupon
    discounts.
  - Online money in and refunds; order counts by payment method and status.
  - Marketplace commission and its GST on parts delivered in the range (the same maths as payouts).
  - Rider deliveries and pay; new accounts, accounts that ordered, guest orders.
  - Sales by day and the top 10 products.
- **"Orders CSV"**: every order in the range with items, delivery, discount, coupon, total, payment
  and Riderzpro invoice number (Excel-safe, audited). New "reports" permission: Owner, Manager,
  Finance.
- **Verified**:
  - Figures cross-checked on the local data: own + marketplace = sales; average = sales ÷ orders;
    commission = 10% of delivered seller sales.
  - CSV columns and download; a reversed range refused; an unknown customer gives 404.
  - Both pages fit a 375 px phone screen.
  - All 468 pages and admin pages answer 200; build clean; no dealer prices or secrets in built
    files.

## 17 Oct 2026 (night, later): Phase 5 part 2, coupons and the Offers page (on V0.4)

- **What a coupon lowers**: Riderzpro's own products and installation (% off with an optional cap,
  or ₹ off), or the delivery charge (free delivery).
  - Never a marketplace seller's items, so seller invoices and payouts don't change.
  - The discount is spread over Riderzpro's lines on the GST tax invoice, lowering the taxable
    value and the tax ("Less coupon CODE").
- **Checkout**:
  - A "Coupon code" box in the order summary. The server works out the discount from its own prices.
  - The code is re-checked when the cart changes, and again inside the order's transaction with
    the coupon row locked, so the last use can't be taken twice.
  - The WhatsApp message, confirmation email, order pages (customer and admin) and invoice show it.
- **Limits**: minimum order, start/end dates, total uses, uses per customer (by mobile). Cancelled
  orders don't count, so an abandoned online payment frees its use.
- **Admin**:
  - `/admin/coupons`: create; pause or resume; end for good; show on or hide from `/offers`.
  - Usage count and rupees given.
  - The new "coupons" permission: Owner, Manager, Catalogue.
- **`/offers`**: public, live codes with "Copy code"; in the footer and the sitemap. The old-site
  redirect `/offers → /shop` is removed.
- **Database**: migration 010 (coupons, coupon_redemptions, orders.discount, orders.coupon_code).
- **Verified**:
  - 34 scripted coupon checks:
    - invalid, duplicate, over-90% and too-short codes refused
    - the discount and its cap; a seller-only cart refused; a mixed cart discounted only on
      Riderzpro items
    - minimum order; free delivery
    - one use per customer; a one-use code refused for the next customer, then freed by
      cancelling
    - browser totals ignored; pause and end; ended can't resume; /offers lists only live public
      codes
    - invoice and admin order show the coupon
  - Invoice maths checked: ₹4,499 − ₹449 = ₹4,050, taxable ₹3,432, IGST ₹618.
  - The cart re-quotes when the quantity changes.
  - `/offers` fits a 375 px phone screen.
  - The payment (29), signature (18) and invoice (22) tests still pass; build clean.

## 17 Oct 2026 (night, later): Phase 5 part 1, admin team logins and roles (on V0.4)

- **Own login for each person**:
  - Everyone signs in at `/admin/sign-in` with their own email and password.
  - This replaces the single shared admin username and password.
  - Sessions last 12 hours: a random token in an HttpOnly, SameSite=Strict cookie, stored hashed.
  - Wrong logins are rate limited and recorded.
- **First login, and the way back in**: the owner types `ADMIN_USER` / `ADMIN_PASSWORD` from the
  hosting settings into the same form, then invites the team from `/admin/team`.
- **Roles**: Owner, Manager, Operations, Catalogue, Finance, Support (`src/lib/admin/roles.ts`).
  - The admin home page shows each role only its own tools.
  - Every admin page and API route checks the role itself. `src/proxy.ts` only checks for the
    session cookie (no database there).
- **Team page** (owner):
  - Invite by name, email and role. The one-time link (72 h) is shown to copy, and also emailed
    once email is set up.
  - Change role, disable or enable, password reset link, sign out everywhere, cancel open links.
  - Owners can't lock themselves out; there is always an active owner.
- **Audit log page**: every sign-in, invite, decision and change, newest first, with search and a
  filter by who.
- **Database**: migration 009 (admin_users, admin_sessions, admin_invites). The audit log now
  records the person's email instead of "admin".
- **Development**: with `ADMIN_USER` unset, `/admin` stays open on this computer as before.
- **Verified**:
  - 54 scripted checks:
    - redirect and 401 without a session; Origin check; wrong password; cookie flags
    - invite (replace, cancel, reuse refused, short or mismatched password refused)
    - role limits on pages and APIs; a role change and disabling apply at once
    - a reset ends other sessions and the old password stops working
    - no passwords in the audit log; sign-out; rate limit
  - Every admin page and API opens for the owner.
  - Sign-in returns to the page asked for.
  - Team and Audit log pages fit a 375 px phone screen.
  - Build clean; no dealer prices or secrets in built files.

## 17 Oct 2026 (late night): Phase 3 live tracking and Phase 4 payments, invoices and messages (on V0.4)

Built by three agents in parallel, each with its own files, then reviewed, merged and connected.
Missing keys and decisions are listed per person in `docs/team/`.

- **Live tracking (Phase 3)**:
  - **Rider app**: after a one-time consent, the phone sends its location every ~10 s, only while a
    job is accepted or picked up (`/api/rider/location`).
  - **Customer order page**: while the parcel is on its way, it shows a map (Leaflet + OpenStreetMap)
    with the moving rider, road route and ETA (OSRM; straight line at 20 km/h if that fails) and the
    steps.
  - **Alerts**: "Arriving" (500 m) and "arrived" (50 m) are recorded once per job and send the
    customer an SMS. Dispatch gets an off-route alert after 3 minutes off course.
  - **Admin dispatch**: shows live riders.
  - **Delivery point**: "Detect my location" at checkout fills the address and stores the GPS point
    on the order. Otherwise the address is geocoded (Nominatim) when a rider accepts.
  - **Retention**: the trail is deleted when a job closes; a delivered job keeps its last point for
    30 days.
- **Payments (Phase 4, Razorpay)**:
  - **Paying**: "Pay online" at checkout. The server prices the order and creates the Razorpay order,
    Checkout opens, and the payment is confirmed by the signature check and the webhook
    (`/api/payments/razorpay/webhook`, duplicates ignored, amount must match).
  - **Stock**: held for 30 minutes; unpaid orders are released automatically (Razorpay is asked
    first).
  - **Refunds**: full or partial from the admin order page.
  - **Sellers**: see, hear about and count online orders only once paid.
  - **Without keys**: "Pay online" is shown as unavailable and WhatsApp ordering works as before.
- **Invoices and messages (Phase 4)**:
  - **GST tax invoice**: for Riderzpro's own items, installation and delivery, numbered
    `RZP/2026-27/00001` per financial year with no gaps, and frozen once issued. Printable at
    `/account/orders/<number>/invoice` (link on the order page) and `/admin/orders/<id>/invoice`.
    Seller items are listed as invoiced by the seller.
  - **Confirmation email and SMS**: sent once per order, when an online payment is confirmed or an
    admin confirms a WhatsApp order. Also SMS for a rider's new job offer.
  - **Shared helper**: one email/SMS module (`messaging.ts`) used by sign-in codes (no change in
    behaviour) and order messages. Each send is logged without its text.
- **Other**:
  - Permissions-Policy now allows Razorpay's payment window.
  - Payment help and FAQ text updated.
  - New settings listed in `.env.example`.
- **Database**: migrations 006 (tracking), 007 (payments), 008 (invoices, message log).
- **Verified**:
  - type check; production build; no dealer prices or secrets in built files
  - all 460 pages load
  - the agents' tests on the merged code: 18 signature checks, 22 invoice/message checks and 29
    payment checks (against a mock Razorpay)
  - on the local site:
    - an order with a GPS point stores it
    - an out-of-range point is refused
    - an admin confirm sends the SMS once and issues the invoice
    - "Detect my location" fills the checkout form
    - checkout has no sideways scroll at 375 px
  - Tracking was tested end to end by agent A: pings, arriving/arrived, ETA, delivery, trail deleted.
- **Not yet tried for real**: Razorpay with real test keys, real SMS/email, tracking on two real
  phones over https. These need the team's inputs (`docs/team/`).

## 17 Oct 2026 (night): audit and fixes, merged to main

`docs/AUDIT_V0.4.md`: full check of the merged site, nine findings and one found while testing, all
fixed: old riderzpro.com links redirect; wishlist syncs one change at a time (no lost or returning
items across devices); guest orders appear in the account straight away; checkout address prefill;
demo store refresh keeps product addresses; seller sees the rider booking; rider id in the order
audit; expired rows cleaned up hourly; no account check on seller/rider/store screens; tidy rider
references. All 470 pages load, build clean, no dealer prices in built files.

## 17 Oct 2026 (evening): Phase 2 riders done

Riderzpro's own delivery riders in Delhi NCR (Delhi, Gurugram, Noida, Greater Noida, Ghaziabad,
Faridabad). Orders outside the area still go by courier.

- **Rider app** (`/rider`, phone-first, own header, linked from the footer as "Ride with Riderzpro"):
  sign in with a mobile code → apply (name, city, vehicle, registration number for motor vehicles,
  three declarations) → status page → once approved, the deliveries screen: online/offline switch,
  new offers (pay shown up front; the customer's phone and full address only after accepting),
  accept / decline / give back, "picked it up", finish with the customer's 4-digit code, today / to be
  paid / paid, recent deliveries and payouts. The screen refreshes every 15 seconds.
- **No identity documents are uploaded or stored.** Approval needs the admin to confirm they checked
  the licence, RC and insurance in person.
- **Admin**: `/admin/riders` (approve, ask for changes, reject, suspend, reinstate; audited),
  `/admin/dispatch` (accepted/packed seller shipments with both ends in Delhi NCR; choose a rider,
  pay (default ₹60) and a note; live jobs with cancel and "reset code tries"), `/admin/rider-payouts`
  (record a bank/UPI payment for all delivered, unpaid jobs). Hub tiles with counts.
- **Order flow**: a rider can only collect a packed shipment; pick-up marks it shipped (courier
  "Riderzpro rider", reference RZR-…), the customer's code marks it delivered and completes the order.
  While a rider is booked the seller can't ship, deliver or cancel it themselves; an admin cancel
  also cancels a rider job not yet picked up. 5 wrong codes lock the job until the admin resets it.
- **Customer**: the order page shows the rider's first name and vehicle, and the 4-digit handover
  code while the parcel is on its way.
- **Codes and keys**: `otp.ts` now uses the old site's names without extra setup (RESEND_API_KEY +
  RESEND_FROM or OTP_EMAIL_FROM; TWILIO_*; MSG91_*). RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are listed
  in `.env.example` for the payments phase.
- **Database**: migration 005 (riders, rider_sessions, rider_jobs, rider_job_events, rider_payouts;
  rider_login code purpose).
- **Verified** with the local database: application rules, approval check, no double booking, seller
  blocked while a rider is booked, other riders can't see or move a job, accept → pick up → wrong codes
  → right code → order completed, earnings and payout (a second payout refused); rider app in the
  browser at phone size. Production build clean (533 pages), no dealer prices in built files.
- **Test data on this computer only**: riders Saroj (9811111111) and Raju Singh (9822222222), and
  test orders for Ravi Kumar (9123456780).

**Next**: Phase 3, live tracking (rider location during a delivery, map on the customer's order page).

## 17 Oct 2026 (later): V0.4 started, Phase 1 customer accounts done

Branch `V0.4`, from `main`. Plan: `docs/MIGRATION_PLAN_V0.4.md` (what to bring over from the old
riderzpro.com repo; this repo becomes the live site, car accessories only).

**Phase 1: customer accounts (done, tested)**
- **Sign-in** at `/account/sign-in`: a 6-digit code to a mobile or email, no password. The first
  code creates the account and asks for a name. Codes for customers have their own purposes, so a
  seller's code can never sign a customer in.
- **Account pages** (`/account`, noindex, disallowed in robots): overview; orders with each seller's
  progress (received → confirmed → packed → shipped → delivered), courier and tracking number;
  addresses (up to 10, one default); help messages with our replies; settings (name, add or change
  mobile/email with a code, sign out, sign out on all devices, delete account; orders are kept but
  unlinked).
- **Orders join the account**: checkout links the order from the session (never the request). On
  sign-in with a verified mobile, earlier guest orders placed with that mobile join too (email is not
  used for this: it is unverified at checkout).
- **Checkout** fills in the account's name, mobile, email and default address, offers the other saved
  addresses and can save a new one; the confirmation links to the order in the account. Guest
  checkout is unchanged.
- **Wishlist and chosen car** are saved to the account and merged on sign-in (newest first; a car
  picked on this device wins). Signing out clears them from the browser only.
- **Help desk**: "Send us a message" on `/contact` (guests) and `/account/help`; admin inbox at
  `/admin/customer-support` (reply in the account, or open WhatsApp for guests).
- **Header**: account icon (dot when signed in) and "Sign in / My orders" in the mobile menu.
- **Code delivery providers** (`src/lib/server/otp.ts`, `.env.example`): Resend for email, MSG91 or
  Twilio for SMS. Untested until real keys are added; development still prints codes in the console.
- **Database**: migration 004 (customers, customer_sessions, customer_addresses, customer_wishlist,
  customer_tickets, orders.customer_id).
- **Verified**: about 40 API checks (codes, wrong/reused codes, guest-order claiming, another account
  cannot see or change your orders or addresses, cross-site requests blocked, unsafe wishlist links
  refused, contact change, sign out everywhere, delete); in the browser: sign-in, name step, address
  book, checkout prefill and order, order page after the seller shipped it, help message and admin
  reply. Production build clean (533 pages), no dealer prices in built files.

**Offline Store (same day)**
- **Dashcams**: 9 Qubo dashcams added to the Indus Enterprises demo store (details, prices and photos
  from quboworld.com, read 17 Oct 2026; `src/lib/server/demo-dashcams.ts`, photos in
  `public/demo/qubo/`), in a "Cameras" category with a camera icon. Refresh the demo store from
  `/admin/vendors` to load them.
- **Blue verified tick** beside the store name and on the welcome screen (new `verified` colour token).
- **Compare** now shows details side by side: price, MRP, saving, brand, category, part type,
  warranty, fitment, stock, every specification and highlights, under a compact product header;
  "Differences only" hides matching rows.

**Next**: Phase 2 (riders) once the owner answers the open questions in the plan (delivery area,
SMS/email provider, rider pay).

## 17 Oct 2026: sellers do both, online marketplace restored

Decided by the owner: a seller works with Riderzpro in two ways. This reverses the removal of the
online marketplace made on 16 Oct (commit `449a110`) and keeps the Offline Store screen.

- **Online marketplace (restored, adapted).** An approved seller's admin-approved (`live`) products are
  listed on the main website and sold across India: merged after the house items in `/shop` and the
  department pages (`CatalogCard` shows "Verified seller" and "Sold by <store>"; quick add puts a
  `vendor:` line in the cart), a public seller storefront and product pages, and entries in the
  sitemap. Checkout is the existing `/api/orders` (server-side pricing and stock).
- **New public URLs:** `/sellers/[slug]` and `/sellers/[slug]/[product]`. `/store/[slug]` stays the
  owner-only, password-locked Offline Store screen (still `noindex` and disallowed in robots).
  `storeHref` / `vendorProductHref` now point to `/sellers/...`; new `offlineStoreHref` points to `/store/...`.
- **Gate and privacy.** `src/lib/server/marketplace.ts` (restored from before `449a110`) uses
  `LIVE_PRODUCT_WHERE` (product live and seller approved); no holiday-mode references; public fields only;
  everything degrades to empty without a database so the house shop and sitemap still build.
- **Wording.** `/vendor` landing now has two sections (sell online across India; Offline Store screen)
  and a six-step how-it-works; sign-in perks, onboarding store-step hint, settings text, products empty
  state, suspension messages ("hidden from the website and the Offline Store") and the README and
  `docs/VENDOR_PORTAL.md` updated. Dashboard has a "View my online store" link beside the Offline Store box.
- **Footer and nav:** "Sell on Riderzpro" stays under Partners and in the Cars menu, pointing to `/vendor`.
- **Offline Store screen redesigned** (`src/components/vendor/store-screen/`), with the welcome screen
  and tile look taken from an owner-approved Lovable prototype: welcome screen with a slow product-photo
  slideshow, store name and city with a red verified tick, category cards and "Touch to explore";
  photo-first tiles with discount and low-stock badges, Add and Compare; category rail, sort, "Find for
  my car" (brand → model); full-screen product view with gallery and zoom; compare up to 3; order
  drawer with savings; show-at-counter screen with an order token (A-1, A-2 …) and print; idle reset;
  an "Exit" button for the seller (top right on the welcome screen and the product screen; one tap opens
  the seller options, and leaving needs the seller's password, then returns to the dashboard).
- **Welcome screen fits every screen:** spacing, the headline, category cards and "Touch to explore"
  scale with the screen height, so the button stays on screen on short TVs and laptops (checked at
  1920×1080, 1422×661, 1280×720, a portrait tablet and a phone).
- **Voice search** on the Offline Store: a mic in the search box (browser speech recognition, Indian
  English; hidden where the browser has none; needs HTTPS). Search ignores filler words ("show me …
  please"), matches plurals and spoken numbers ("six point five inch"). `Permissions-Policy` now allows
  the microphone for this site only (`microphone=(self)`).
- **Demo store:** Indus Enterprises is in Delhi. The `/admin/vendors` demo panel can now change the demo
  seller's login email and mobile as well as its password, and accepts a short (5+ character) demo
  password; real sellers still need 10+ characters with letters and numbers. On a new database: open
  `/admin/vendors` → Demo store → enter login email `indus@riderzpro.com`, a mobile and the demo
  password → Create. The demo password is not stored in the repository.
- **Verified:** production build clean (533 pages), no dealer prices in any built file; `/shop`,
  department pages, `/sellers/indus-enterprises` and its product pages, sitemap and robots checked on
  the local site; Offline Store welcome, browse and spoken-phrase search checked in the browser.
- **Still open:** seller fees for the Offline Store; a browser pass at 360 px in light and dark on
  `/sellers/...`; trying the mic on a real smart TV.

## 16 Oct 2026: V0.3 seller portal and Offline Store

Branch `V0.3`, pushed to GitHub. Commits from this session: `449a110` to `de036a7`, plus this update.

### Direction change (agreed with the owner today)

- Seller products are **not** on the main Riderzpro website (shop, department pages, search, sitemap).
- A seller registers, completes KYC, is approved by the Riderzpro team, and adds products through the
  seller login (each product is approved by the team too).
- The seller opens an **Offline Store** screen on a tablet or TV in their own shop: a kiosk-style order
  screen (like a McDonald's order screen) that shows their available products. Customers browse, open
  a product, add items to a cart and show the cart at the counter.
- It is a **showcase only**: it ends at the cart. No payment and no saved orders are planned for it.
- Orders and Payments stay in the seller dashboard as they are.

### Completed

**Offline Store screen** (`/store/[slug]`)
- Opened from a highlighted "Offline Store" box on the dashboard overview and a link in the dashboard menu.
- Full screen, always light mode, no Riderzpro header, footer or WhatsApp button.
- Category tabs, search, product tiles with photo, price, MRP and discount, and quick "Add".
- Tapping a product opens it full screen with the full description, laid out like the main site
  product page: gallery, price, tags, highlights, then About this product, Highlights, Product
  details (brand, category, part type, warranty, fits) and Specifications.
- Order panel (side panel on large screens, bottom bar on phones), review screen with
  "Show this screen at the counter" and "Start new order".
- An idle order clears itself after 2 minutes and a 20-second "Still there?" prompt.
- Shows the seller's approved products that have stock; sold-out products leave the screen.
- Only the signed-in owner can open it. Opening it locks that browser session to the screen: the
  dashboard and seller APIs refuse it until the seller enters their password (migration 003).
  Another device or a fresh sign-in is not locked.

**Main website**
- Seller items removed from `/shop`, department pages and the sitemap; the public seller product page
  was removed; `/store` is disallowed in `robots.txt` and marked `noindex`.

**Demo store "Indus Enterprises"**
- Created or refreshed from a panel on `/admin/vendors` (first run asks for a login email, mobile and
  password). An existing `asha-accessories` store is renamed instead of duplicated.
- 6 Autoform seat covers and 6 RECOIL speakers copied from the main catalogue with real photos and
  prices; imported descriptions are tidied (heading lines dropped, "Label: value" lines moved to
  specifications, long lines moved to the description, repeats removed).

**Seller dashboard and portal**
- The main site's header (shopper menus, cart), footer, bottom bar and WhatsApp button no longer show
  on the seller dashboard; the dashboard has its own Riderzpro logo.
- Holiday mode removed (settings card, banner, API route, visibility rule). The `holiday_mode`
  database column stays but is unused.
- Wording updated on the `/vendor` landing page, the seller sign-in page, the onboarding store step,
  settings, the empty products list and the suspension messages to describe the Offline Store
  instead of selling on the main site.
- "Not allowed" messages now depend on the seller's status (draft, under review, changes requested,
  rejected, suspended, approved).
- Migration 002: one pending bank-change request per seller, enforced by the database.

**Other fixes**
- The WhatsApp order message no longer repeats the order number.
- The pricing table's CSV export reuses the shared, formula-safe CSV cell escaper.
- README rewritten to cover V0.1 to V0.3; `docs/VENDOR_PORTAL.md` updated for the Offline Store.

### Verified

- About 180 scripted checks against the local database, all passing: sign-up, codes, onboarding,
  request changes and resubmit, product approve / reject / request changes / bulk approve / revision
  approve and discard, bank change (including two simultaneous requests), support tickets, password
  change, bulk stock and price saves, archive / restore / delete, mixed and house-only orders, returns
  with restock, payouts after the 7-day window, store screen access rules, lock and unlock.
- In the browser: the store screen (add, product view, order review, start new order, idle reset,
  password exit, phone / tablet / desktop sizes), the dashboard, and the checkout form on the main
  site (WhatsApp hand-off and the fallback when the order service is down).
- Production build clean (533 pages, no warnings) and no dealer prices in any built file, checked
  before the last round of changes (holiday mode removal, dashboard header, full-screen product view).
  Type check clean after them.

### Next / remaining

1. **Run `npm run build` again** and the dealer-price check after today's last changes.
2. **Owner decisions before launch:**
   - Postgres provider and `DATABASE_URL` on the host.
   - `VENDOR_DATA_KEY` generated and kept safe (it encrypts sellers' bank and PAN details).
   - `ADMIN_USER` / `ADMIN_PASSWORD` set wherever the site is reachable.
   - An email/SMS provider for sign-up codes (`src/lib/server/otp.ts`); until then the team verifies
     contact details during KYC.
   - Seller fees for the Offline Store, and the seller terms page content.
   - Whether uploaded photos and documents move to object storage later.
3. **On the deployed site:** create the Indus Enterprises demo store from `/admin/vendors`.
4. **Catalogue data:** some RECOIL product pages on the main site (for example `/products/rd365`) show
   messy imported highlights (heading lines, repeated specs). Clean the import or the data.
5. **Optional:** hide the shopper header on the seller onboarding and review-status pages too
   (`/vendor/onboarding`, `/vendor/pending`), as was done for the dashboard.
6. Earlier open items (used-car claims, OE promotion, warranty and delivery wording, and others) are
   still listed in `docs/AUDIT.md`.
