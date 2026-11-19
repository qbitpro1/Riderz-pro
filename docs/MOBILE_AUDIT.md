# Mobile responsiveness audit — customer pages

Task 4, "Phone check of every customer page". Audited and fixed 9 Nov 2026 on branch
`customer-site-updates` (local, not committed or pushed).

## How it was tested

- **Browser, automated:** each page loaded at 320, 375, 390, 430, 768, 1024, 1440 and 1920 px wide
  (overlay scrollbars, as on phones). Each width was checked for horizontal page scroll, elements
  past the screen edge (ignoring ones clipped by a scroll container, e.g. carousels), tap targets
  under 44 px and text under 11 px.
- **Browser, by hand at 320 px:** menu drawer, cart drawer, cart lines, quantity buttons, checkout
  form and its validation errors, account tabs, the help popup on Track order, the product page's
  sticky add-to-cart bar, and whether the end of each page scrolls clear of the bottom nav.
- **Desktop regression:** cart and footer re-checked at 1440 px after the changes.
- **Not browser-tested:** the order details page timeline and live tracking map (needs a real
  order; placing one would have sent an order email through Resend), and the Razorpay payment
  popup (no Razorpay keys locally). These were reviewed in code only.

## Routes

| Section | Route(s) | Main files |
| --- | --- | --- |
| Home | `/` | `src/app/page.tsx`, `components/home`, `components/layout/*` |
| Shop | `/shop`, `/shop/[category]` | `components/catalog/CatalogBrowser.tsx`, `FilterSidebar.tsx`, `CatalogCard.tsx` |
| Product | `/products/[slug]` | `components/product/*` (BuyBox has the phone sticky bar) |
| Cart | `/cart` | `components/cart/CartView.tsx`, `CartDrawer.tsx` |
| Checkout | `/cart` (inline form) | `components/cart/CheckoutForm.tsx` |
| Account | `/account`, `/account/{orders,addresses,help,settings}`, `/account/sign-in` | `components/account/*` |
| Track order | `/track-order`, `/account/orders/[number]` | `app/track-order/*`, `components/tracking/LiveTracking.tsx` |

Shared on every page: `Header`, `BottomNav` (phones/tablets), `MobileDrawer`, `Footer`,
`AssistantFab`.

## Baseline

The site was already built mobile-first. Before any change, **no page scrolled sideways and nothing
stuck out past the screen at any of the 8 widths.** Phone layouts already existed: bottom nav, menu
drawer, filter/sort sheets, sticky add-to-cart bar, safe-area padding, and footer padding that
clears the bottom nav. The issues found were tap targets, an iOS zoom trigger, overlap from the
floating AI button, and cramped layouts in a few components.

## Findings and fixes

| # | Page | File | Issue | Root cause | Fix | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | All forms (checkout, help, sign-in, filters) | `globals.css` (`.field`, `.cl-input`, `.fs-field`) | iPhone zooms the page when a field is tapped | Field text 15 px; iOS Safari zooms into fields under 16 px | 16 px below 768 px; 15 px kept from tablet up. (At first this only took effect for `.field`: the phone rule sat before the `.cl-input` / `.fs-field` definitions. Moved after them and re-tested: all three are 16 px on phones.) | Fixed, tested |
| 2 | Cart / checkout | `AssistantFab.tsx` | Ask AI button covered the qty "+" and the right edge of address fields | Fixed button over a dense form page | Hidden on `/cart` below `lg` | Fixed, tested |
| 3 | Cart | `CartView.tsx` | Product name wrapped one word per line at 320 px | Name, qty, price and remove in one flex row | Phones: 2-row grid (thumb + name / qty · price · remove); `sm+` unchanged via `sm:contents` | Fixed, tested 320 + 1440 |
| 4 | Cart | `CartView.tsx` | Remove 16×16, qty buttons 36×40, "Empty cart" / "Continue shopping" 16 px tall | Icon-sized buttons; text links | 44 px on phones (desktop sizes unchanged) | Fixed, tested |
| 5 | Cart drawer | `CartDrawer.tsx` | Remove 16×16, qty 36×36 | Same | 44×44 | Fixed, tested |
| 6 | Checkout | `CheckoutForm.tsx` | "Save this address" checkbox row ~16 px tall | Inline label | 44 px row | Fixed |
| 7 | All | `Footer.tsx` | Footer links ~20 px tall | Plain text links with `space-y` | 44 px rows below `md`; desktop unchanged | Fixed, tested 320 + 1440 |
| 8 | All | `MobileDrawer.tsx` | Menu sub-links 37 px | `py-2.5` on 11 px text | `min-h-11` | Fixed |
| 9 | All | `BottomNav.tsx` | Tab labels 10 px | Design choice | 11 px (fits: "Search" 53 px in a 64 px cell at 320 px) | Fixed, tested |
| 10 | Shop and others | `globals.css` (`a.chip`, `button.chip`) | Sub-category chips 28 px tall | Badge-sized chip used as a link | 44 px below 768 px; label-only chips unchanged | Fixed, tested |
| 11 | All | `globals.css` (`.btn-sm`) | Small buttons 38 px ("Detect my location", call button) | `min-height: 2.375rem` | 44 px below 768 px | Fixed, tested |
| 12 | Home | `ui/Section.tsx` (`SectionFootLink`) | "View all" 21 px tall | Underlined text link | 44 px box, underline kept tight to text | Fixed, tested |
| 13 | Home / Shop | `catalog/BrandStrip.tsx` | "Shop {brand}", "RECOIL catalogue" ~17 px | Text links | 44 px | Fixed, tested |
| 14 | Shop / Product | `catalog/CatalogCard.tsx` | Brand line and "from" at 10 px | Small type | 11 px (discount badges on images left at 10 px) | Fixed |
| 15 | Account | `account/AccountNav.tsx` | At 320 px "Help" and "Settings" off-screen with no hint | Scrollable tab row | Edge fade shows more tabs; current tab scrolled into view | Fixed, tested |
| 16 | Order details / tracking | `account/orders/[number]/page.tsx`, `tracking/LiveTracking.tsx` | 5-step progress labels truncated ("Confi…") | 5 columns × ~48 px at 320 px | Vertical list on phones, 5-across from `sm` | Fixed, **code only** |

## Checked and fine (no change)

- Header, hero carousel, product grids, filter and sort sheets, product gallery, sticky add-to-cart
  bar, menu drawer width, cart drawer width, help popup (fits, scrolls inside), account pages, empty
  cart state, checkout validation (errors under each field, focus moves to the first one), payment
  radios (inside full-width tappable cards).
- End of every page scrolls clear of the bottom nav and the product sticky bar.
- Breadcrumbs are under 44 px; left as is (secondary navigation, conventionally small).

## After

- No horizontal scroll and nothing past the screen edge on any page at any of the 8 widths.
- Tap targets under 40 px at 320 px: home 118 → 20, cart → 7, account pages → 5. What remains is
  mostly breadcrumbs, carousel dots (32×44), and single short words in 44 px-tall footer rows.

## Left open

- Order details timeline and live tracking: test with a real order on a phone.
- Razorpay popup on a phone: test with test keys.

`npm run lint` and `npm run typecheck` both pass. (Three unused `Icon` imports left over from
earlier uncommitted edits were removed.)
