# Riderzpro

Car & bike accessories online at https://riderzpro.com. Riderzpro is a registered trademark of
Motorbotz Automotive Pvt. Ltd., which makes and sells the range. The store carries the Riderzpro
house range plus RECOIL, Blaupunkt and Autoform, across eight departments, with fitment checks per
car and installation at the company's garages in Bengaluru, Hyderabad and Pune. Since V0.3, approved
third-party sellers list their products through a seller login. Approved products are sold online on the
main website across India (shop, department pages, a public storefront per seller), and each seller can
also show their stock to walk-in customers in their own shop on the Offline Store screen (see "Vendor portal").

Secondary areas, under the "Cars" and "Services" menus: garage and detailing services (PPF, audio, body kits,
off-road, interiors, performance), used-car buy/sell, and the Mahindra BE 6 programme.

Current branch: `V0.3`. See "Version history" for what each version added.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4 (CSS-first
`@theme` in `src/app/globals.css`). Validation is zod; the seller icons are `lucide-react`.

- **House catalogue: no database.** Content is typed modules plus imported catalogue data under
  `data/`, prerendered at build time.
- **Vendor portal (V0.3): Postgres.** Sellers, their products, orders, invoices and payouts live
  in a database (`pg` in production, embedded PGlite in development). See "Vendor portal".

Next 16 differs from older versions (for example `src/proxy.ts` replaces `middleware`); check
`node_modules/next/dist/docs/` before using a Next API you are unsure of.

## Run

```bash
npm ci
npm run dev        # http://localhost:3000
npm run typecheck
npm run build && npm start
```

In development no environment variables are required. With `DATABASE_URL` unset, the vendor portal
uses an embedded database in `.data/pglite` (git-ignored), and `/admin` is open when `ADMIN_USER` /
`ADMIN_PASSWORD` are unset. One-time codes (seller sign-up) are printed to the server console.
Copy `.env.example` to `.env.local` to set anything.

Other scripts (`package.json`): `catalog:rebuild`, `sync:recoil`, `verify:recoil`, `import:recoil`,
`import:blaupunkt`, `extract:pdf-images`, `inventory:refresh`, `inventory:check-robots`. `npm run lint`
is defined but the repo has no ESLint config, so it does not run.

## Environment variables

All names are in `.env.example`. None is committed with a value. Set the same names in the hosting
dashboard for production.

| Name | Used for |
|---|---|
| `ADMIN_USER` | Username for the HTTP Basic login on `/admin/*` and `/api/admin/*`. |
| `ADMIN_PASSWORD` | Password for the same login. In production, `/admin` returns 404 until both are set. |
| `SHOPIFY_STORE_DOMAIN` | The Shopify store's permanent address, e.g. `your-store.myshopify.com` (no `https://`). |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Storefront API token. Server-side only; never prefix with `NEXT_PUBLIC`. |
| `SHOPIFY_API_VERSION` | Storefront API version. The built-in default is a placeholder; set the current stable version. |
| `NEXT_PUBLIC_SHOPIFY_CHECKOUT` | Set to `1` to show the "Checkout securely" button. Anything else keeps WhatsApp-only checkout. |
| `DATABASE_URL` | Postgres connection string for the vendor portal. Required in production; blank in development uses PGlite. |
| `VENDOR_DATA_KEY` | 32 random bytes, base64 (`openssl rand -base64 32`). Seals sellers' bank account and PAN. Required in production; losing it makes stored bank details unreadable. |

The code also reads `DATABASE_POOL_MAX` (optional pool size), and `OTP_EMAIL_PROVIDER` /
`OTP_SMS_PROVIDER` (reserved; no one-time-code provider is wired yet). They are not in
`.env.example`.

## Architecture

The flow is one direction: taxonomy, then catalogue, then store contract, then the product page.

- **Taxonomy** (`src/lib/data/taxonomy.ts`): the eight departments (interior, exterior,
  multimedia, covers & guards, utilities, off-roading, lighting, accessories), their groups, and their
  URLs (`/shop/{department}`, `?group=`, `?oe=1`). Navigation, home and shop all read from it.
- **Catalogue** (`src/lib/catalog`): every brand's products projected into one `CatalogItem` shape,
  with filters, sorting and facets. The shop reads filters from the query string (`?brand`, `?group`,
  `?oe`, `?max`, `?sort`, `?q`). Brand definitions live in `catalog/brands.ts`. Items carry a
  `buyable` flag; non-buyable ones show "Price on request" or "Launching soon". Menu groups with no
  product on the shelf are hidden.
- **Store contract** (`src/lib/store`): `types.ts` is the product-detail and cart-line shape;
  `products.ts` builds `PRODUCT_DETAILS` server-side, each with an `indexable` flag. Every house
  product lives at `/products/{slug}` (`productHref`).
- **Product page** (`src/app/products/[slug]`): one page for every house product, emitting `Product`
  JSON-LD. Unknown slugs are a plain 404.
- **Cart** (`src/components/cart`): React context persisted to localStorage and synced across tabs.
  Checkout is a delivery form that posts to `/api/orders` (V0.3), then hands the order to WhatsApp
  with the order number. If the order service is down (503) or unreachable it falls back to the
  WhatsApp-only order. With Shopify configured (`docs/SHOPIFY_SETUP.md`) there is also a hosted
  checkout through `/api/checkout`.
- **Collections** (`src/lib/data/collections.ts`): curated predicates over catalogue fields
  (bestsellers, price caps, real savings of at least 10% off MRP, originals, fitted by us). Pages at
  `/collections/{slug}` exist only for collections that match at least one product.
- **Navigation data** (`src/lib/data/nav.ts`): every menu (header, More panel, drawer, bottom bar,
  footer) is data. Change a menu there, not in components.
- **Server-only rule**: `src/lib/catalog` (index), `src/lib/store/products.ts` and `src/lib/search`
  hold dealer prices and import `server-only`. Never import them from a client component; pass
  plain props down instead. Client-safe modules (taxonomy, collections, nav, `store/types.ts`) hold
  no dealer data. This applies to the vendor portal too: nothing under the vendor portal may import
  house catalogue internals into a client component.
- **Brand stores**: `/recoil` and `/autoform` keep deeper catalogues and feed the shared shop;
  `/brands/{slug}` pages show each brand's range with the shop filters.
- **Admin** (`/admin`, behind `src/proxy.ts`): launch checklist, catalogue, Shopify CSV export
  (`/admin/shopify`), stock inventory, PPF and BE 6 views, plus the seller queues from V0.3.
- **Dealer stock API** (`/api/dealer/inventory`, `/api/dealer/inventory/upload`): used-car stock
  feeds. Uploads need a dealer key; none have been issued yet, so uploads return 401.

### Themes

Two themes (light and dark) via tokens in `globals.css`. Use token classes only: `bg-void`,
`bg-carbon`, `text-chalk`, `text-ash`, `text-dim`, `text-accent`, `border-tint/N`. Never use
`white/N`, `black/N`, hex or rgba in class names. Text laid over a photograph must sit in a block
with `data-theme="dark"` plus the `.scrim`, so it stays legible in both themes.

### SEO layer

- `src/app/layout.tsx`: site-wide metadata, `AutoPartsStore` and `WebSite` JSON-LD (the search action
  targets `/shop?q=`).
- `src/lib/data/seo.ts`: landing-page copy plus `pageMeta` (canonical ignores the query string, so
  filtered views consolidate; Open Graph and Twitter tags are set per page), `breadcrumbLd`,
  `itemListLd`, `ldJson` (escapes JSON-LD).
- `src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx` / `twitter-image.tsx`, `not-found.tsx`.
- Only products with `indexable: true` are in the sitemap; others carry `noindex`.
- SEO landings: `/car-accessories`, `/car-modification`, `/suv-modification`, `/used-cars`.
- Security headers are set in `next.config.ts`; `X-Powered-By` is removed. Set HSTS at the host.

## Vendor portal and Offline Store (V0.3)

Approved sellers list car and bike accessories through the seller login and use Riderzpro in two ways:

1. **Online marketplace.** A seller's admin-approved (`live`) products are listed on the main website and
   sold anywhere in India: merged after the house items in `/shop` and the department pages, on a public
   storefront (`/sellers/[slug]`) and public product pages (`/sellers/[slug]/[product]`), marked "Sold by
   <store>". Add to cart goes to the existing checkout (`/api/orders`, server-side pricing and stock).
   Visibility gate: product `live` and seller `approved` (`LIVE_PRODUCT_WHERE`); a suspended seller's
   products leave the website at once. Public pages never show email, mobile, legal or tax ids, bank or
   address lines.
2. **Offline Store screen.** The same catalogue, shown to walk-in customers on a tablet or TV in the
   seller's own shop (below). Owner-only and password-locked.

- **Database.** Postgres through `DATABASE_URL` (`src/lib/db/client.ts`, migrations in
  `src/lib/db/migrations.ts`). In development with no `DATABASE_URL`, an embedded PGlite database in
  `.data/pglite`. Production refuses to start without `DATABASE_URL`. Parameterised SQL only.
- **Seller journey.** Sign-up (`/vendor/auth`) with email and mobile codes, a six-step KYC onboarding
  (`/vendor/onboarding`), a review status page (`/vendor/pending`), then the seller dashboard
  (`/vendor/dashboard`): products, inventory, pricing, orders, payments, settings, notifications and
  support. Bank account number and PAN are stored encrypted (AES-256-GCM, `VENDOR_DATA_KEY`); only the
  last four digits are kept in clear.
- **Admin queues** (HTTP Basic, `/admin/*`): seller KYC review and decisions, product approval
  (including content edits to live products), change requests (bank details), orders, payouts and
  seller support tickets. Every decision is audited and notifies the seller.
- **Offline Store screen** (`/store/[slug]`). Opened from the highlighted box on the seller dashboard,
  on a tablet or TV in the seller's shop. Full screen, always light, no site chrome: category tabs,
  search, product tiles and details, an order with quantities and total, and a review screen that says
  "Show this screen at the counter". Cart only: nothing is saved or paid. Shows the seller's approved
  (`live`) products with stock. Only the signed-in owner can open it; opening it locks that session
  (dashboard and seller APIs refuse it) until the seller's password unlocks it. An idle order clears
  after 2 minutes and a 20-second prompt.
- **Demo store.** "Indus Enterprises", created or refreshed from the panel on `/admin/vendors`: seat
  covers and speakers copied from the house catalogue. An existing `asha-accessories` store is renamed.
- **Orders.** Online orders for seller products come through the main-site cart, which posts to `/api/orders`. The server recomputes every price, shipping and the
  total (the browser sends only who, where, which products and how many), checks stock, and splits the
  order per seller. Sellers accept, pack, ship (courier and tracking required) and deliver; a GST
  invoice (CGST/SGST, GSTIN, invoice number) is available per order.
- **Payouts.** A delivered order becomes payable after a 7-day hold (the return window). Settlement is
  the order subtotal less commission (default 10%) less 18% GST on that commission, in whole rupees.
  An admin records the bank transfer; payouts before the window ends are refused.
- **Not wired yet.** One-time code delivery (email/SMS) has no provider in production, so contact
  details are verified by the admin team during KYC. Uploads are stored in the database, not object
  storage.

Key URLs:

| Who | URL | What |
|---|---|---|
| Public | `/vendor`, `/vendor/auth` | "Sell on Riderzpro" landing; sign in / sign up / reset |
| Public | `/sellers/[slug]`, `/sellers/[slug]/[product]` | Seller storefront and product page (online marketplace; indexed, in the sitemap) |
| Seller | `/vendor/onboarding`, `/vendor/pending` | KYC steps; review status |
| Seller | `/vendor/dashboard/...` | Overview (Online store and Offline Store boxes), products, inventory, pricing, orders, payments, settings, notifications, support |
| Seller | `/store/[slug]` | Offline Store screen (owner only, locks the session; `noindex`, disallowed in robots) |
| Admin | `/admin/vendors`, `/admin/vendor-products` | KYC queue and demo store panel; product approval queue |
| Admin | `/admin/orders`, `/admin/payouts`, `/admin/support`, `/admin/change-requests` | Orders, payouts, tickets, change requests |
| API | `/api/orders` | Order capture |

`docs/VENDOR_PORTAL.md` is the contract every part of the portal is built against, including the
non-negotiable rules (identity from the session only, server-checked status moves, sealed bank/PAN,
integer-rupee money, admin behind Basic auth, dealer prices stay server-only). Read it before changing
`src/app/vendor`, `src/app/store`, `src/app/api/vendor`, `src/app/api/admin` or `src/lib/server`.

## Version history

Branches: `main` is the original V0.1 baseline; `V0.2` and `V0.3` build on it.

### V0.1 (`main`)

- First Motorbotz site, with the Mahindra BE 6 flagship programme.
- Used-car marketplace, sell-your-car flow, build configurator, audio builder, PPF, body kits,
  off-road, interiors, performance and garage pages, locations, and 24 vehicle landing pages.
- Accessories shop with RECOIL, Blaupunkt and Autoform catalogue imports (`scripts/`, `data/`), a cart
  with installation add-ons and WhatsApp checkout, and a comparison page.
- Dealer stock pipeline and `/admin` pages (catalogue, inventory, PPF, BE 6, launch). Dealer prices
  kept out of the browser.
- Static site: React and Next only, no database.

### V0.2

- Rebranded Motorbotz to Riderzpro, with the vector logo and light and dark themes.
- Rebuilt as an accessories-first store: eight departments, rebuilt navigation (dropdowns, More panel,
  drawer, bottom bar, footer), new home page, collections and price-ceiling filter.
- One store contract and one product page for every house product at `/products/{slug}`; cart drawer
  with id-keyed lines; browser-local wishlist; compare page removed.
- Launch groundwork: SEO layer (metadata, JSON-LD, sitemap, robots, social image, 404), policies
  rewritten for an accessories store, FAQ and order tracking, Shopify checkout groundwork
  (`/api/checkout`, products CSV, `docs/SHOPIFY_SETUP.md`), Basic-auth for `/admin`.
- Three audit rounds (`docs/AUDIT.md`):
  1. Store flows: Shopify CSV option columns fixed, CSV formula injection closed, cart line merge and
     quantity cap fixed, WhatsApp message spacing restored.
  2. Security, mobile, accessibility and SEO: dealer upload now needs a dealer key; sticky bars no
     longer covered by the WhatsApp button; search is a proper dialog; security headers; per-page share
     tags; escaped JSON-LD; contrast fixes; wishlist shows live prices; held-back products show
     "Price on request".
  3. Content: placeholder copy removed, empty menu groups hidden, `buyable` flag on catalogue items,
     search index and sitemap corrections, shopper-facing "dealer pricing" wording removed.
- Open items (owner decisions on used-car claims, OE, PPF warranties and others) are listed in
  `docs/AUDIT.md`.

### V0.3 (current)

- Vendor portal: database, seller sign-up and sessions, six-step KYC onboarding, review status,
  seller dashboard (products, inventory, pricing, orders, payments, settings, notifications, support).
- Admin queues for sellers and products, change requests and support; `/api/admin/*` now sits behind
  the same Basic auth as `/admin`.
- `/store/[slug]` became the owner-only Offline Store screen (kiosk-style order screen, cart only,
  password-locked, always light) with a highlighted entry on the dashboard; demo store "Indus
  Enterprises".
- Online marketplace restored (17 Oct 2026): sellers do both. Approved products are sold on the main
  website again (`/shop`, department pages, sitemap) with a public storefront and product pages now at
  `/sellers/[slug]` and `/sellers/[slug]/[product]`; the Offline Store stays at `/store/[slug]`.
  `/vendor` landing, sign-in perks and seller messages describe both. Holiday mode stays removed.
- Order capture at `/api/orders` (server-side pricing and stock), per-seller orders, GST invoices,
  payouts with a 7-day hold.
- Migrations 002 (one pending change request per seller) and 003 (store screen lock).
- Verified with scripted end-to-end flows against the embedded database; status and open decisions are
  at the end of `docs/VENDOR_PORTAL.md`.

## Launch checklist

- [ ] Domain `riderzpro.com` pointed at the host; `SITE.url` in `src/lib/data/site.ts` matches it.
- [ ] Verify `SITE` details (phone, email, socials, GSTIN) and the organisation address and rating
      in `src/app/layout.tsx` before launch.
- [ ] Shopify (or other checkout): follow `docs/SHOPIFY_SETUP.md`.
- [ ] Real product photography replacing stock images where the catalogue still uses `MEDIA` keys.
- [ ] Analytics and tag IDs (none are wired yet); submit `/sitemap.xml` in Search Console.
- [ ] Logo as vector: the header uses the vector logo, but the social card (`opengraph-image.tsx`) is
      a typographic stand-in.
- [ ] Review the legal and support pages with the company, and the open owner decisions in
      `docs/AUDIT.md`.
- [ ] Vendor portal owner decisions (V0.3):
  - [ ] Postgres provider, and `DATABASE_URL` set on the host.
  - [ ] `VENDOR_DATA_KEY` generated and stored safely (losing it loses sellers' bank details).
  - [ ] `ADMIN_USER` / `ADMIN_PASSWORD` set wherever the site is reachable.
  - [ ] A one-time-code provider (email and SMS), wired in `src/lib/server/otp.ts`.
  - [ ] Seller fees for the Offline Store, and commission defaults for online orders (code default 10%).
  - [ ] Create the demo store on the live database from `/admin/vendors` if wanted.
  - [ ] Seller terms page content.
  - [ ] Whether uploads move to object storage later.
- [ ] `npm run build` clean; check `/robots.txt`, `/sitemap.xml` and `/opengraph-image` on the live host.

## Docs

- [`docs/VENDOR_PORTAL.md`](docs/VENDOR_PORTAL.md): the vendor portal and Offline Store contract, URLs, environment
  and status.
- [`docs/WORK_UPDATE.md`](docs/WORK_UPDATE.md): what was done in each session and what is next.
- [`docs/AUDIT.md`](docs/AUDIT.md): the V0.2 audit, what was fixed and what is still open.
- [`docs/SHOPIFY_SETUP.md`](docs/SHOPIFY_SETUP.md): turning on Shopify checkout, step by step.
