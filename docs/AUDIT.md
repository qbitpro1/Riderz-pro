# V0.2 audit — findings and status

Audit run by five read-only agents (store flows, links/routes, theme/accessibility,
security/SEO/build, content). Reports from auditors 1, 3 and 4 are recorded below.
**Auditors 2 (links/routes crawl) and 5 (content/copy) had not reported when the
session ended — re-run those two.**

Status: `FIXED` = fixed and pushed · `OPEN` = confirmed, not yet fixed · `NOT A BUG` = checked, intended.

## Fixed
- FIXED **[critical] Shopify CSV wrote option columns under the wrong keys** (`Option1Name` vs `Option1 Name`), so every product with variants exported with empty options and Shopify checkout for them would fail. `src/lib/shopify/productCsv.ts`. Verified: 27 multi-variant products, 0 with empty options.
- FIXED [low] CSV formula injection: cells starting `= + - @` are now prefixed with `'`.
- FIXED [medium] Re-adding a cart line overwrote its installation add-on (`CartContext.add` merged the whole line). Now only the quantity grows.
- FIXED [low] Cart quantity was unbounded while checkout caps at 99. Capped at 99 (`MAX_QTY`).
- FIXED [low] WhatsApp order message lost its blank separator lines (`cartMessage.ts`).

## Open — high
- OPEN **[high] `/api/dealer/inventory/upload` accepts anonymous uploads** (12 MB files parsed server-side, caller-chosen `dealerId`/`verification`, raw parser errors returned, Google Sheets fetch with no timeout). Require the dealer API key, allow-list `verification`, generic errors, fetch timeout. `src/app/api/dealer/inventory/upload/route.ts`.
- OPEN **[high] WhatsApp button covers the sticky action bars on `/ppf/*` and `/be-6` on phones.** Only `/products/` lifts it. `src/components/layout/WhatsAppFab.tsx:42`, `src/components/ppf/StickyPpfCta.tsx`, `src/components/be6/StickyBar.tsx`.

## Open — medium
- Autoform accessories 38–44 shelved in the wrong group (seat hook, duster, dining tray, air purifier, odour eliminator, number plate → all in Utilities › Organisers; cooling cushion → Covers & Guards › Dashboard). Shelve by product name. `src/lib/catalog/adapters.ts` (`autoformAccessoryItem`), `src/lib/data/taxonomy.ts`.
- Wishlist "Add to cart" uses the price saved when the item was wishlisted (stale). `src/components/wishlist/WishlistView.tsx`.
- Checkout API: validate buyability (price, availability, indexable, option choices) BEFORE the Shopify-configured check; canonicalise line ids (`a=1&b=2` vs `b=2&a=1` pass the duplicate check as two lines). `src/app/api/checkout/route.ts`, `src/lib/shopify/variants.ts`.
- No security headers; `X-Powered-By` sent. Add `headers()` (X-Content-Type-Options, Referrer-Policy, X-Frame-Options/frame-ancestors, Permissions-Policy) and `poweredByHeader: false` in `next.config.ts`; HSTS at the host.
- OpenGraph/Twitter tags incomplete: `og:url` missing on 375/426 pages, `og:type` missing on 288 (all products), many pages inherit the root title, `/be-6` pages have no `og:image`. Set per page in `generateMetadata` (there is a `pageMeta` helper in `src/lib/data/seo.ts`).
- SearchPanel is not a dialog: no `role="dialog"`/`aria-modal`, no focus trap, no focus return, resets body overflow to `""`. Copy the MobileDrawer pattern. `src/components/search/SearchPanel.tsx`.
- Hidden-but-focusable controls: WhatsApp button before 400px scroll, `StickyPpfCta` links. Add `invisible`/`inert` when hidden.
- `BeforeAfter` slider is `touch-none` → traps vertical scroll on phones. Use `touch-pan-y`. `src/components/ppf/BeforeAfter.tsx:46`.
- Desktop menu opened by hover cannot be closed with Escape unless focus is inside. `src/components/nav/DesktopNav.tsx:176-189`.
- Footer legal text can sit under the sticky bars on `/products/*`, `/ppf/*`, `/be-6` on phones (only 64px bottom clearance).
- Menu drawer / filter sheet keep scroll lock + focus trap if the viewport crosses the breakpoint while open. Close on `matchMedia` change.
- Light theme: `from-void/70` fades on photos outside a dark island are white washes — `audio/page.tsx:136`, `locations/page.tsx:35`, `interiors/page.tsx:84`, `ppf/page.tsx:128`, `garage/page.tsx:76`, `performance/page.tsx:94`. Use `.scrim-soft` or a `data-theme="dark"` wrapper.
- `/admin/*` is open in development when `ADMIN_USER`/`ADMIN_PASSWORD` are unset (production returns 404). Exposes import flags and unpublished SKUs, not dealer prices. Set the env vars wherever the site is reachable.

## Open — low
- Held-back RECOIL pages (noindex) show price + "In stock" + an `Offer` in JSON-LD but cannot be bought. Hide price/availability and omit the Offer when not buyable. `src/components/product/BuyBox.tsx`, `src/app/products/[slug]/page.tsx`.
- "From" label stays after an option is chosen; JSON-LD should be `AggregateOffer` for from-priced products.
- Product JSON-LD with no `offers` on `autoform-mat-8/9/10` — omit the Product block when there is no price.
- JSON-LD not escaped (bare `JSON.stringify`) in `src/app/layout.tsx:119-121`, `products/[slug]/page.tsx:87`, `cars/[slug]/page.tsx:97`, `ppf/guide/[slug]/page.tsx:44` — use `ldJson` from `src/lib/data/seo.ts`.
- 404s for unknown `/products/{slug}` cached for a year (`s-maxage=31536000`). Use `dynamicParams = false` or short cache headers.
- `tierFor(null)` returns "mid": price-on-request items appear in the ₹5,000–₹25,000 facet while `maxPrice` excludes them. `src/lib/catalog/types.ts`.
- WhatsApp button's product-page message rule uses `^\/product\/` (singular) so it never matches. `WhatsAppFab.tsx:16`.
- `text-danger` (#c42b2b) is nearly identical to the accent (#c81e1e) in the light theme — error text looks like brand text.
- Wishlist button: flipping label + `aria-pressed` is ambiguous; BE 6 Explorer highlight chips lack `aria-pressed`; removing an active filter chip loses focus; breadcrumbs lack `aria-current`.
- Heading order on `/shop/interior` (h1 → h3 cards → h2).
- `Photo` always falls back to a descriptive alt, even for decorative backgrounds. Allow `alt=""`.
- White on WhatsApp green is ~3.1:1 for small text.
- Browser `theme-color` follows the OS scheme, not the in-page toggle.
- Hard-coded colours: `be6/Configurator.tsx:166` (swatch hatch, fine), `ppf/BeforeAfter.tsx:69`, gold `rgba(217,167,96,…)` glows in `be-6/page.tsx:145`, `be-6/limited-edition/page.tsx:63,422`.
- Titles: "Contact Riderzpro | Riderzpro" style double brand on 3 pages; 40 titles > 70 chars; 75 descriptions > 170 chars.
- Dealer API key compare is not timing-safe; keys would live in `data/inventory/dealers.json` (empty today). Add `server-only`, `timingSafeEqual`, move keys out of the repo before onboarding dealers.
- `src/lib/catalog/readiness.ts` and `src/lib/inventory/*` have no explicit `server-only` (protected transitively).
- Cart has no cross-tab `storage` sync and does not validate stored lines; wishlist silently drops the oldest item at 50.
- Page weight: `/` HTML 480 KB (full menus + RSC payload inlined).
- `DEFAULT_SHOPIFY_API_VERSION` (2025-07) is a placeholder — set the current stable version when the store is created.

## Not a bug
- NOT A BUG — organisation `aggregateRating` 4.8 / 3,184 and the house products' ratings: confirmed real by the owner.

## Verified clean
- Dealer prices: 0 leaks across 4,077 built files (client chunks + every prerendered page), the search index, the Shopify CSV and the sitemap. `server-only` guards present on every module that touches `dp`.
- `/admin` Basic-auth proxy: correct in production (404 when unset; 401/200 when set; encoded/case variants covered; constant-time compare).
- `/api/checkout`: strict validation, 503 until Shopify is configured, no redirect built from user input.
- 426 sitemap URLs all 200, one self-referencing canonical each, no `noindex` in the sitemap; all JSON-LD parses; every Product offer price matches the page.
- Catalogue: card and detail agree for all 301 items; slugs unique; free-shipping boundary correct; dark-island rule holds everywhere text sits on a photo; no invalid nesting or duplicate ids in served HTML.
