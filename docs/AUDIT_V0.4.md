# V0.4 audit (17 Oct 2026): all findings fixed

Scope: `main` = `V0.4` at `95d9d92` (customer accounts, riders, Offline Store changes), on the local
site with the local database.

## What was checked, and passed

- **Every page:** all 451 sitemap URLs plus 19 account, rider, seller and admin pages return 200.
  Unknown seller and product pages answer 404. Signed-out visits to `/account`, `/rider/dashboard`,
  `/vendor/dashboard` and `/store/...` redirect to the right sign-in page.
- **Production build:** clean (533 pages). No dealer prices in any built file. The blue tick is in
  the production CSS.
- **API safety:** every write route checks the request's Origin. Every account, rider and seller
  read route requires the right session.
- **Flows on the merged code:**
  - Seller sign-in and overview; Offline Store screen; public storefront with the dashcams.
  - Customer order placement, linked to the signed-in account.
  - Rider jobs and earnings; admin dispatch and hub counts.
- **Layout:** the header fits at 1280px with the new account icon. No page scrolls sideways at 360px
  (home, shop, storefront, cart, all account pages, contact, track order, rider app, seller pages,
  admin dispatch and riders).
- **Earlier targeted tests** (still valid):
  - About 40 account checks and the full rider cycle.
  - Cross-account and cross-rider access refused.
  - The seller is blocked while a rider is booked.
- **Whole-order cancel:** an admin can't cancel or complete an order until each seller part is
  finished or cancelled. Cancelling a part already cancels its rider job, unless the rider has
  picked it up.

## Bugs found

| # | Severity | Where | Problem | Fix |
|---|---|---|---|---|
| 1 | **High (before go-live)** | Old riderzpro.com links | When the domain moves to this site, the old site's addresses go to 404: `/login`, `/signup`, `/auth`, `/orders`, `/order/:id`, `/order-confirmation/:id`, `/track/:id`, `/dashboard/customer`, `/dashboards`, `/offers`, `/assistant`, `/support`, `/privacy`, `/terms`, `/product/:id`, `/vendor/login`, `/vendor/signup`, `/vendor/sign-up`, `/vendor/:id`, `/admin/login`, `/super-admin/*`, `/app`. | Permanent redirects in `next.config.ts` to the matching new pages (sign-in, `/account/orders`, `/legal/*`, `/contact`, `/shop`, `/vendor/auth`, `/admin`, `/`). |
| 2 | Medium | Wishlist sync (`AccountContext`, `/api/account/wishlist`) | Each change sends the whole list and replaces the saved one. With two devices signed in, a device holding an older list wipes items added on the other. Items removed on one device come back at the next sign-in merge. | Send single add/remove changes (POST / DELETE per item) and keep the merge-on-sign-in only for items saved while signed out. |
| 3 | Medium | Guest orders (`customers.ts`) | An order placed while signed out, with the mobile of an existing account, only joins that account at the next sign-in (seen in testing). | Also link guest orders with the account's verified mobile when the account's orders page loads (same rule, verified mobile only). |
| 4 | Low | Checkout (`CheckoutForm`) | When saved addresses load late, the default address overwrites what the customer already typed. Editing a picked saved address keeps the radio on it, so the edit is used for the order but never saved. | Auto-pick only while the address fields are empty; editing a field switches to "A different address" (with "save" offered). |
| 5 | Low | Demo store refresh (`demo-store.ts`) | A refresh deletes and recreates the demo products, so their web addresses change and older orders lose their product links. | Update demo products in place by SKU, keeping slugs. |
| 6 | Low | Seller order page | When a Riderzpro rider is booked, the seller only gets a notification. The order page doesn't say so; they learn only when "shipped" is refused. | A banner on the seller's order page: rider booked, keep it packed, status of the pickup. |
| 7 | Low | Audit trail | Rider pick-up and delivery are logged as `system/rider` on the order without the rider's id (the job's own event log has it). | Log the rider id on the order audit entries too. |
| 8 | Low | Database housekeeping | Expired customer, seller and rider sessions, used codes and old rate-limit rows are never deleted. | A small cleanup on sign-in or a daily job that deletes expired rows. |
| 9 | Info | Every page | The account check (`/api/account/me`) also runs on the seller dashboard, the Offline Store and the rider app, where it is not needed. | Skip it on those routes. |

Not bugs, by design:
- `/vendor/auth` sends a session that showed the Offline Store back to the store screen.
- A customer who mistyped someone else's mobile at guest checkout lets that person see the order
  once they sign in. Earlier orders are only linked by verified mobile; email is never used.

## Status: fixed (17 Oct 2026)

All nine are fixed and tested on the local site, plus one more found while testing:

1. Old site links redirect (28 addresses checked); this site's own `/vendor/*`, `/support/*`,
   `/garage`, `/admin` and `/rider` pages are unaffected.
2. Wishlist: per-item add/remove; the account is the reference after the first sync. Tested with
   two "devices": an item removed on one doesn't come back from the other.
3. Guest orders with the account's verified mobile appear on the orders page straight away.
4. Checkout: saved addresses never overwrite typing; editing a picked one switches to "A different
   address" and offers to save it.
5. Demo store refresh updates in place: all 21 web addresses unchanged, order links still work, the
   refreshed photos load and old copies are deleted.
6. The seller's order page shows the rider booking, collection and delivery, and hides "mark it
   delivered" while a rider has it.
7. Order audit entries carry the rider's id.
8. Expired sessions, day-old codes and rate-limit rows are deleted at most hourly; live sessions kept.
9. No account check on the seller dashboard, Offline Store or rider app.
10. (found in testing) Rider references could contain dashes ("RZR--QSFSA"); now letters and digits.

Re-run after the fixes: type check, production build (533 pages), no dealer prices in built files,
all 470 pages 200, no server errors.

## Fix plan (one pass, in this order)

1. Redirects for old live URLs (#1): needed before the domain switch.
2. Wishlist add/remove changes (#2) and guest-order linking on the orders page (#3).
3. Checkout address prefill (#4).
4. Demo store in-place refresh (#5), seller "rider booked" banner (#6), rider id in the audit (#7).
5. Housekeeping cleanup (#8) and skipping the account check on seller/rider/store routes (#9).
6. Re-run: type check, production build, dealer-price scan, the sitemap crawl, the account and
   rider API tests, phone-width check; then commit, push `V0.4`, merge to `main`.

Still needed outside the code before go-live: `DATABASE_URL`, `VENDOR_DATA_KEY`, `ADMIN_USER` /
`ADMIN_PASSWORD`, the SMS/email keys (old names now work), and a demo-store refresh on the live
database.
