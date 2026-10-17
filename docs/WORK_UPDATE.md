# Work update

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
