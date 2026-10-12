# V0.2 audit — findings and status

Audit run by five read-only agents (store flows, links/routes, theme/accessibility,
security/SEO/build, content). Auditors 1–4 are recorded below; **auditor 5 (content/copy)
was re-run on 12 Oct 2026 and its findings are still to be added.**

Status: `FIXED` = fixed and pushed · `OPEN` = confirmed, not yet fixed · `NOT A BUG` = checked, intended.

## Fixed
- FIXED **[critical] Shopify CSV wrote option columns under the wrong keys** (`Option1Name` vs `Option1 Name`), so every product with variants exported with empty options and Shopify checkout for them would fail. `src/lib/shopify/productCsv.ts`. Verified: 27 multi-variant products, 0 with empty options.
- FIXED [low] CSV formula injection: cells starting `= + - @` are now prefixed with `'`.
- FIXED [medium] Re-adding a cart line overwrote its installation add-on (`CartContext.add` merged the whole line). Now only the quantity grows.
- FIXED [low] Cart quantity was unbounded while checkout caps at 99. Capped at 99 (`MAX_QTY`).
- FIXED [low] WhatsApp order message lost its blank separator lines (`cartMessage.ts`).

### Round 2 — 12 Oct 2026 (four fix agents, reviewed and merged)
- FIXED **[high] Dealer upload accepted anonymous uploads.** Now needs a dealer key (`Authorization: Bearer` or `x-dealer-key`); dealer id and tier come from the key; generic errors; 15 s timeout on the Sheets fetch; host re-checked. The uploader on `/partners` asks for the key. No dealer keys exist yet, so every upload returns 401 until one is issued.
- FIXED **[high] WhatsApp button covered the sticky bars on `/ppf/*` and `/be-6`.** Bars publish their height as `--sticky-bar-h`; the button and the footer clear it. Measured at 375 px: no overlap.
- FIXED [medium] Autoform accessories 38–44 shelved by product name (Phone Holders, Car Care, Travel Add-ons, Number Plate Frames, Cushions & Comfort).
- FIXED [medium] Wishlist uses the live price; unavailable and option products handled.
- FIXED [medium] Checkout API validates buyability before the Shopify-configured check; line ids canonicalised.
- FIXED [medium] Security headers added; `X-Powered-By` removed. HSTS still to be set at the host.
- FIXED [medium] OpenGraph/Twitter tags set per page through `pageMeta`; product pages set their own.
- FIXED [medium] SearchPanel is a proper dialog (focus trap, focus return, Escape, overflow restored).
- FIXED [medium] Hidden WhatsApp button and sticky bars are no longer focusable.
- FIXED [medium] `BeforeAfter` slider no longer traps vertical scroll.
- FIXED [medium] Hover-opened desktop menu closes with Escape.
- FIXED [medium] Footer clears the sticky bars and bottom nav on phones.
- FIXED [medium] Menu drawer and filter sheet close when the viewport crosses their breakpoint.
- FIXED [medium] Light-theme white washes on six photos replaced with `scrim-soft`.
- FIXED [low] Held-back products show "Price on request" and emit no Offer; "From" clears once options are chosen; `AggregateOffer` for from-priced products; no Product JSON-LD without a price.
- FIXED [low] JSON-LD escaped through `ldJson` everywhere.
- FIXED [low] Unknown `/products/{slug}` is a plain 404 (`dynamicParams = false`).
- FIXED [low] Price-less items have no price tier.
- FIXED [low] WhatsApp product-page message rule (`/products/`).
- FIXED [low] Light-theme danger colour is now crimson (#9f1239), distinct from the accent.
- FIXED [low] `aria-current` on breadcrumbs, stable wishlist button name, `aria-pressed` on BE 6 chips, focus kept when a filter chip is removed.
- FIXED [low] Heading order on shop and collection pages.
- FIXED [low] WhatsApp green darkened to #0b7a43 (5.4:1 with white).
- FIXED [low] `theme-color` follows the in-page toggle.
- FIXED [low] Gold glows on the BE 6 pages use the theme token.
- FIXED [low] Double brand in titles; long titles and descriptions shortened on static pages.
- FIXED [low] Dealer key compare is timing-safe; `server-only` on inventory modules and `readiness.ts`.
- FIXED [low] Cart syncs across tabs and validates stored lines; wishlist says when it drops an item at 50.
- FIXED [medium] Dead `#explore` anchor on the BE 6 mobile bar (found by the links audit) now points at `#choose`.

## Open

### Medium
- Seven menu groups lead to an empty page because no product is shelved there: Interior › Door Panels, Exterior › Foot Rests, Grilles & Chrome, Number Plate Frames (now has one Autoform item — recheck), Covers & Guards › Interior Covers, Utilities › Chargers, Accessories › Travel Add-ons (now has one — recheck). Hide empty groups from the menus or label them "coming soon".
- Held-back RECOIL cards in the grid still show a price and "In stock" (the product page is fixed). Needs an `indexable`/buyable field on `CatalogItem` and a card branch.
- `/admin/*` is open in development when `ADMIN_USER`/`ADMIN_PASSWORD` are unset (production returns 404). Set the env vars wherever the site is reachable.

### Low
- `/shop?oe=1` header says "36 products" while the list says "0 of 301". OE is on hold.
- `/wishlist` has no canonical tag; `/partners` is not in the sitemap.
- Dark-theme danger (#ff5c5c) is still close to the dark accent (#ff4d4d).
- Dynamic titles on `accessories/[vehicle]` not checked for length.
- `Photo` call sites that are decorative still pass a descriptive alt.
- Dealer API keys would live in `data/inventory/dealers.json`; move them out of the repo before onboarding dealers.
- Page weight: `/` HTML 480 KB.
- `DEFAULT_SHOPIFY_API_VERSION` (2025-07) is a placeholder — set the current stable version when the store is created.
- The repo has no ESLint config, so `npm run lint` does not run.
- Three pages returned 500 once under a concurrent first hit on the dev server and 200 on retry (`/brands/autoform`, `/collections/under-999`, `/collections/under-2499`); the production build prerenders them without error.

## Not a bug
- NOT A BUG — organisation `aggregateRating` 4.8 / 3,184 and the house products' ratings: confirmed real by the owner.

## Verified clean
- Round 2 (12 Oct 2026): production build passes; dealer-price scan 0 hits across client chunks and 489 prerendered pages; links audit crawled 648 URLs with no broken internal links, no links to redirects, all 11 legacy redirects single-hop to a 200.
- Dealer prices: 0 leaks across 4,077 built files (client chunks + every prerendered page), the search index, the Shopify CSV and the sitemap. `server-only` guards present on every module that touches `dp`.
- `/admin` Basic-auth proxy: correct in production (404 when unset; 401/200 when set; encoded/case variants covered; constant-time compare).
- `/api/checkout`: strict validation, 503 until Shopify is configured, no redirect built from user input.
- 426 sitemap URLs all 200, one self-referencing canonical each, no `noindex` in the sitemap; all JSON-LD parses; every Product offer price matches the page.
- Catalogue: card and detail agree for all 301 items; slugs unique; free-shipping boundary correct; dark-island rule holds everywhere text sits on a photo; no invalid nesting or duplicate ids in served HTML.
