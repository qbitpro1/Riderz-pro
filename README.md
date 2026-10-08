# MOTORBOTZ

**BUY. BUILD. DRIVE.** — an automotive ecosystem for India: a verified car marketplace, a
modification studio, an accessories store, a premium audio room, a PPF and detailing bay, an
off-road workshop and a performance garage, under one brand.

Built mobile-first for 375–430px handsets, then scaled up to tablet, laptop and large screens.

```bash
npm install
npm run dev              # http://localhost:3000
npm run build            # production build
npm start                # serve the production build
npm run typecheck

npm run catalog:rebuild  # re-import the RECOIL catalogue end to end
```

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16, App Router, Turbopack | Static prerendering for every catalogue page, React Server Components by default |
| Styling | Tailwind CSS v4 with a CSS-first `@theme` | One token file, no config file, no runtime cost |
| Type safety | TypeScript, `strict` | The data layer is the contract the whole site reads from |
| Images | `next/image` + Unsplash CDN | AVIF/WebP, per-breakpoint sizing, lazy by default |
| State | React state + one localStorage-backed cart context | No global state library needed at this size |

Everything renders statically — 118 prerendered routes, no server required to host it.

---

## Information architecture

```
/                        Homepage — 18 sections, hero to WhatsApp CTA
/cars                    Marketplace with 12-facet filtering + EMI calculator
/cars/[slug]             Car detail: gallery, specs, inspection score, modifications, FAQs
/sell                    5-step valuation wizard → free inspection → offer
/shop                    Accessories store, 6 categories
/shop/[category]         Category browse with sub-filters and price bands
/product/[slug]          Product page: fitment, installation, specs, reviews, FAQs
/cart                    Cart with installation add-ons, WhatsApp checkout
/build                   BUILD YOUR CAR — 5-stage configurator with a live costed total
/audio                   4 packages + a custom system builder
/ppf                     Protection, correction and wrap services + comparison sliders
/body-kits               Facelift conversions: current model → desired look → price
/off-road                Suspension / protection / recovery / expedition
/interiors               Custom trim, captain seats, luxury SUV conversions
/performance             Tuning services + legal-compliance notice
/garage                  Workshop services + appointment booking
/builds, /builds/[slug]  Build showcase with full mod lists and real build costs
/accessories/[vehicle]   24 vehicle-specific SEO landing pages (Thar, Fortuner, Creta…)
/used-cars, /car-modification, /car-accessories, /suv-modification   SEO landings
/locations, /contact, /why-motorbotz
/support/[topic]         Shipping, returns, warranty
/legal/[doc]             Privacy, terms
/brands                  Shop by brand — every brand in one index
/brands/[slug]           Brand page: the whole range, filtered, linking out to the brand store
/recoil                  RECOIL brand catalogue — 252 SKUs, authorised reseller
/recoil/[category]       15 category browsers with SKU-first search
/products/[slug]         RECOIL product pages, e.g. /products/recoil-spl4200-4
/compare                 Side-by-side spec comparison, up to 4 products
/build-audio             Budget → car → goal, costed from the live catalogue
/admin/catalog           Internal import and data-quality report
/sitemap.xml, /robots.txt
```

Navigation is designed so any goal is 2–3 taps from the homepage:

- `Home → My Car → Thar → LED → Buy`
- `Home → Build → Thar → Off-road → Package → WhatsApp`
- `Home → Cars → SUV → Fortuner → View → Book Test Drive`

---

## The data layer

All content lives in typed modules under `src/lib/data/`. Nothing is hardcoded into a page, so
swapping any of these for a CMS or an admin API is a one-file change per domain.

| File | Owns | Future admin surface |
| --- | --- | --- |
| `cars.ts` | Listings, filters, related-car scoring | Cars: add / edit / price / photos / status / leads |
| `products.ts` | Categories, SKUs, fitment, price bands | Products: SKU, inventory, price, offers, compatibility |
| `services.ts` | Audio packages, PPF, facelifts, off-road, interiors, performance | Services: packages, pricing, availability |
| `configurator.ts` | Build stages, options, presets, labour and GST rates | Build catalogue and rate card |
| `vehicles.ts` | Brands → models → variants → years, off-road flags | Fitment master |
| `community.ts` | Builds, reviews, stats | Content |
| `site.ts` | Navigation, contact, locations, trust points | Settings and branches |
| `policies.ts`, `seo.ts` | Support, legal and landing-page copy | CMS |
| `catalog/brands.ts` | The brand registry — name, position, store link, provenance | Brands: add / edit / publish |

Leads, orders and appointments all currently resolve to a pre-filled WhatsApp deep link built by
`whatsapp()` in `site.ts`. Each entry point already assembles a structured message — swapping in a
`POST /api/leads` means changing the handler, not the UI.

---

## Used-car inventory system

An aggregation and publishing pipeline for used-car inventory, built so a
listing can only appear if somebody had the right to give it to us.

```
src/lib/inventory/
  types.ts        Listing, ConditionReport, Inspection, ImportLog, statuses
  sources.ts      Source registry — rules, licence, rate limits, robots evidence
  compliance.ts   The gate. Import, images, attribution and the verified badge
  connectors/     motorbotz-direct · dealer-feed · blocked (one per marketplace)
  dedupe.ts       Registration/VIN first, then weighted attribute matching
  freshness.ts    IST timestamps, relative age, status machine, price history
  normalize.ts    Original description generation, confidence scoring
  query.ts        Natural-language search ("Thar under 15 lakh")
  store.ts        Assembles the snapshot the storefront and dashboard read
```

| Command | What it does |
| --- | --- |
| `npm run inventory:check-robots` | Re-reads each source's robots.txt and reports drift from the recorded evidence. |
| `npm run inventory:refresh` | Pulls connected partner dealer feeds, validates them, writes the feed file. |

### The Motorbotz Vehicle Network

Inventory is supplied to us, not copied from anyone. Seven inventory types
(`src/lib/inventory/network.ts`), nine supply channels, four trust tiers.

| Channel | Intake | Status |
| --- | --- | --- |
| Dealer bulk upload | CSV · Excel · XML · JSON | **Live** |
| Google Sheet sync | published sheet URL | **Live** |
| Dealer API | REST | **Live** |
| Dealer website feed | XML · JSON · CSV | Ready to onboard |
| Fleet & leasing releases | CSV · Excel · API | Ready to onboard |
| Manufacturer CPO | via franchise dealer | Needs agreement |
| Auction & wholesale | CSV · API | Needs agreement |
| Private seller intake | Sell Your Car | **Live** |
| Motorbotz owned stock | staff entry | **Live** |

**Why upload-first works:** every DMS on the market already exports CSV or XML
for syndication to Autotrader, Facebook and the rest. We accept the file a
dealer already produces instead of asking them to build an integration — which
is why bulk upload is Phase 1 and the API is Phase 3.

```
/partners                        HAVE CARS TO SELL? — landing, live upload, registration
POST /api/dealer/inventory       create · update · price · sold · remove · photos · availability
POST /api/dealer/inventory/upload  file or Google Sheet → validation report
GET  /api/dealer/inventory       the API contract
```

**The intake pipeline** (`pipeline.ts`) is one path for every source:

```
Source connector → Normalization → Validation → Image validation
  → Duplicate detection → Quality score → Freshness → Inventory
```

- **Normalization** (`normalize-vehicle.ts`) — "Hyundai Creta SX(O) 1.5 Diesel AT",
  "Creta SXO Diesel Automatic" and "Hyundai Creta SXO 2023 D AT" all resolve to
  the same canonical vehicle. Header aliases mean "KM Driven", "Odometer" and
  "Run" land in the same field. Every original string is retained.
- **Validation** — blocking failures stop a car going live; warnings only cost it
  ranking. Marketing copy a supplier cannot substantiate ("accident-free",
  "excellent condition") is a blocking failure wherever it appears, including in
  the variant cell.
- **Image validation** — HTTPS only, dealer-hosted only. Links to another
  marketplace's CDN are rejected: those photographs are not the dealer's to give.
- **Duplicate detection** — stock ID, then VIN, then registration, then
  attributes. Rows with different stock IDs that describe the same car are
  flagged for the dealer, never silently merged or rejected.
- **Quality score** — information, detail, photographs, verification, freshness.
  Internal ranking only; buyers never see a number.
- **Freshness** — 3 days "needs verification", 7 days stale, 14 days hidden.

**Enrichment providers** (`providers.ts`) — researched, not connected. Car
Registration API (India) and Eko RC Verification both publish commercial terms
for VAHAN-backed registration lookup; policy in `ENRICHMENT_POLICY` keeps
lookups to vehicles a supplier gave us and never stores keeper details.

### Sourcing position

| Source | Level | Status |
| --- | --- | --- |
| Motorbotz Direct | 3 | **Live** — our own stock |
| Partner Dealer Feed | 1 | **Live** — imports once an agreement reference is on file |
| CarDekho, CARS24, Spinny, CarWale, OLX Autos, OEM CPO | 2 / 1 | **Blocked — no licence** |

Every named marketplace disallows crawling exactly the paths this system would
need, and none publishes an open inventory API — so they are kept as **prospects,
not sources** (`FUTURE_PARTNERS`). The blocked connectors are real files that
register the source, appear in the dashboard and refuse to fetch:
`assertImportAllowed()` throws with the robots.txt evidence attached. If one of
them ever offers an API or affiliate feed, it is a registry entry plus a
connector file — the marketplace, pipeline and UI do not change.

### Rules the system enforces

1. **No unlicensed data.** The compliance gate runs before any connector fetches,
   and again before any image renders.
2. **Never our badge on someone else's car.** `MOTORBOTZ_VERIFIED` requires an
   entry in `data/inventory/inspections.json`, written after a physical
   inspection. A dealer feed that tries to set it is rejected by the validator.
   Everything else shows *Source listing* or *Motorbotz inventory*.
3. **Original copy only.** Descriptions are generated from stored facts;
   `assertNoQualityClaims()` throws if copy ever claims "excellent condition",
   "accident-free" or similar.
4. **No invented photographs.** A vehicle without `imageRights: "granted"`
   displays *Photos unavailable — contact Motorbotz for vehicle images*.
5. **Nothing is fabricated.** Missing data renders as *Not specified*; unchecked
   condition renders as *Not verified*; a price drop is only shown when two
   different observed prices exist in the recorded history.

### Sample data

The 16 cars carried over from the design build are flagged `demo: true`. They
are excluded from the live-inventory count, labelled as sample records in the
dashboard, and none of them claims a verified badge or an inspection score.

## PPF division

A full paint-protection business module, not a service page.

```
src/lib/ppf/
  films.ts       Brands, films, per-field verified specs with sources
  coverage.ts    21 coverage areas, 7 vehicle classes, 6 packages, pricing engine
  guide.ts       15 guide articles, quality checklist, 10-step prep workflow
  landings.ts    21 SEO landings (6 cities, 15 vehicles) generated from the pricing engine

/ppf              Landing — packages, segments, process, before/after, quality checklist
/ppf/quote        Build Your PPF Package — car → coverage → film → finish → paint → range
/ppf/films        Comparison table, finishes, brand directory
/ppf/films/[slug] Per-film specs and the manufacturer's own warranty terms
/ppf/guide        15 articles, each with FAQPage schema
/ppf/[slug]       PPF in Delhi / PPF for Thar / …
/admin/ppf        Catalogue readiness, lead pipeline, pricing configuration
```

**Pricing engine.** `quote()` takes vehicle class, coverage areas, film tier and
paint condition and returns a *range*: film area × difficulty × class complexity
× tier rate, plus paint preparation. Package cards, landing pages and the
calculator all call the same function, so a landing page can never quote a
number the calculator disagrees with. Full body on a hatchback and full body on
an exotic are not the same price.

**Every specification carries its source.** `Spec<T>` holds `{ value, source,
verifiedAt }`. Warranty periods, cover, exclusions and transferability were read
from XPEL's own warranty documentation. Thickness, gloss level, clarity,
self-healing and hydrophobic performance are `null` and render as *"Not
specified by manufacturer"* — they are the figures customers compare on, and
they are not being filled in from review sites. `/admin/ppf` shows the count of
unverified fields per SKU and what is blocking launch.

**No product image is ever substituted.** A film with no licensed image shows an
explicit "no product image" state naming what is missing.

**Warranty is never genericised.** There is no "Motorbotz PPF warranty" on the
film. Each product publishes the manufacturer's own period, conditions and
exclusions; Motorbotz separately warrants its own workmanship for 12 months.

## The cross-brand catalogue

Every brand keeps its own store — `/recoil` and `/autoform` are unchanged, with
their own sourcing trails, series guides and manufacturer data. On top of them
sits one shared, filterable projection so the shop can rank a RECOIL amplifier
against a Motorbotz one on price and fit rather than on the badge.

```
src/lib/data/products.ts     Motorbotz house range   ─┐
src/lib/data/recoil/         RECOIL, imported         ├─→ src/lib/catalog/adapters.ts
src/lib/autoform/catalog.ts  Autoform, imported      ─┘         ↓
                                                      src/lib/catalog/index.ts
                                                      CATALOG · facets · filters · URL mapping
```

| File | Owns |
| --- | --- |
| `catalog/brands.ts` | The brand registry. One entry per brand: name, position, store link, provenance, catalogue state. |
| `catalog/types.ts` | `CatalogItem` — the one shape every brand is projected into. |
| `catalog/adapters.ts` | One `to…Items()` per brand. The only place that knows a brand's own schema. |
| `catalog/index.ts` | The assembled catalogue, the filter engine, faceted counts, and query-string mapping. |

### Rules this layer follows

1. **Projection, never replacement.** Each brand's module stays the source of
   truth, and every `CatalogItem.href` points back at the page that owns it.
2. **Absence is rendered, not filled.** A source without a rating, a price or a
   model list produces `null` — the card shows "Price on request" or omits the
   stars rather than inventing them.
3. **Fitment is never asserted.** Only `universal` or an explicit model slug
   counts as a fit. An item whose source says nothing about fitment drops out of
   a fitment-filtered view instead of claiming to fit.
4. **A registered brand with nothing published says so.** `state: "importing"`
   renders an honest empty state, not an empty grid.

### Filtering

`CatalogBrowser` is the one filter UI, used by `/shop`, `/shop/[category]`,
`/brands/[slug]` and `/accessories/[vehicle]`. Filters round-trip through the
query string, so every filtered view is a shareable URL:

```
/shop?brand=recoil&category=audio&tier=mid
/shop/interior?brand=autoform
/brands/recoil?sub=Component
```

Facet counts are computed per dimension with that dimension's own selection
ignored, so ticking one brand still shows how many products the others would
add. Pages that own a dimension pass it as `locked` — a brand page locks
`brands`, a category page locks `categories` — and it disappears from the filter
rail rather than becoming a filter you can clear out from under the page.

## The RECOIL catalogue pipeline

Motorbotz is an authorised RECOIL reseller. The catalogue is **imported**, not
hand-written, so a new price list is a data drop rather than a rebuild.

```
data/recoil/price-list-2026-05-*.psv     the price list, transcribed from the PDF (source of truth)
data/recoil/source/*.pdf.txt             text extracted from the PDFs, kept for verification
data/recoil/manufacturer-mirror.json     official RECOIL catalogue, mirrored
data/recoil/overrides.json               optional hand-checked corrections
        ↓
src/lib/data/recoil/catalog.generated.json
```

| Command | What it does |
| --- | --- |
| `npm run sync:recoil` | Mirrors recoilaudio.com (WooCommerce Store API, carries an explicit SKU field) and recoilaudiousa.com (Shopify). 1,255 manufacturer products. |
| `npm run verify:recoil` | Asserts every SKU, DP and MRP in the .psv appears in the text extracted from the source PDF. Fails the build if a row can't be traced back. |
| `npm run import:recoil` | Matches, enriches, prices, flags and publishes. Writes the generated catalogue and the data-quality report. |
| `npm run catalog:rebuild` | All three, in order. |

### Rules the importer enforces

1. **The price list is the authority** for SKUs, DP, MRP and master pack.
   Manufacturer data only ever *adds*.
2. **SKU matching is exact.** There is no fuzzy fallback — a near-miss can never
   inherit another model's images. `SG-65` does not accept `SG-65P`.
3. **Nothing is inferred.** RMS is never derived from peak, impedance is never
   assumed, compatibility is never guessed. Missing figures render as
   *"Not specified by manufacturer"*.
4. **Uncertain records don't publish.** Anything with a blocking flag lands in the
   verification queue and is excluded from the storefront.

### Pricing model

| Field | Visibility |
| --- | --- |
| MRP | Public |
| Motorbotz selling price | Public — MRP less a per-category margin, admin-editable |
| Discount % | Public, derived |
| **DP (dealer price)** | **Server-side only.** Stripped by `toPublic()` at every boundary that reaches the browser, and deliberately not rendered on `/admin/catalog` because that route has no authentication yet. |

### Image provenance

Every image carries its source, source page, matched SKU, fetch timestamp and a
usage note. Where no authentic image can be matched to the exact model number,
the product shows **IMAGE VERIFICATION REQUIRED** rather than a photo of
something similar.

## Design system

Tokens live at the top of `src/app/globals.css`.

- **Base** deep black `#050607` and carbon `#0a0c0e`, with graphite surfaces
- **Type** white chalk `#f4f5f6`, ash `#9aa1aa` for secondary, dim for tertiary
- **Accent** electric ice `#5ce1ff`, used sparingly — active states, verification, micro-detail
- **Gold** `#d9a760` for premium and signature tiers only
- **Primary CTA** is white on black; the accent never becomes the button colour except on the
  configurator's commit action
- **Type** Archivo (display, tight tracking, restored word-spacing) over Inter (body)
- Glassmorphism appears in exactly two places: the header and the search overlay

Components worth knowing:

- `Reveal` — one shared IntersectionObserver for every scroll animation
- `Photo` — `next/image` wrapper that forces an explicit `sizes` hint at every call site
- `BeforeAfter` — pointer-driven comparison slider, keyboard-operable, labels simulated states
- `Configurator` / `AudioBuilder` — live-costed selection with WhatsApp handoff
- `FitmentPicker` — "What do you drive?", persisted, filters the store to your car

---

## Performance notes

- 118 static routes; no server-side rendering on the request path
- Every `Photo` passes a `sizes` hint, so a 390px handset never fetches a desktop frame
- AVIF/WebP output with a 30-day CDN cache and a restricted quality set
- Client components are limited to what genuinely needs interaction: header, search, filters,
  configurator, cart, forms and sliders. Every page shell, card and content block is a server
  component
- Fonts are self-hosted through `next/font` with `display: swap` and no layout shift

---

## Compliance

Performance and off-road pages carry an explicit statement that work is done within the Central
Motor Vehicles Rules: emissions hardware is retained, exhaust output stays within CMVR limits,
original ECU maps are archived, and anything needing an RTO endorsement or insurer notification is
put in writing before work starts. `PERFORMANCE_DISCLAIMER` in `services.ts` is the single source
for that copy.

---

## Content

All imagery is automotive photography served from the Unsplash CDN and catalogued in
`src/lib/media.ts` with descriptive alt text. Replace the entries in that file with your own studio
photography and every page picks it up. Comparison sliders that simulate a "before" state say so on
the face of the component.
