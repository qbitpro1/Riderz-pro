# Audit V0.5: code quality, bugs and launch readiness (18 Oct 2026)

Scope: all 535 source files (71k lines) on `V0.4` after Phases 1–5 and the AI work.
Method:
- ESLint (Next core-web-vitals + TypeScript) added and made clean.
- The server code read in full where money or data integrity is involved.
- Scripted sweeps over every API route (auth, Origin check, rate limit), every SQL string
  (interpolation), every transaction (calls that escape it), outbound calls (timeouts), env usage vs
  `.env.example`, and dependencies (`npm audit`).

## Already fixed in the quality pass (commit 460d89c)

- Checkout re-picked the default saved address after an account refresh, overwriting the shopper's choice.
- Shop screen special price could stay on screen past its expiry (expiry checked only when something else re-rendered).
- Voice search reported "listening" to its parent on every render.
- `/cars/latest` "today / yesterday" groups froze at build time.
- 22 effects that set state synchronously (extra renders, flicker) rewritten:
  - state is now derived or adjusted while rendering;
  - forms that start from the saved car remount when it changes;
  - one shared garage store;
  - one polling hook that never overlaps requests.
- Unused code and stale lint suppressions removed; JSX text entities escaped.

## Found, by priority (all fixed, 18 Oct 2026)

| # | Pri | Issue | Fix |
|---|-----|-------|-----|
| 1 | P1 | Housekeeping (unpaid and uncollected orders, tracking trails, expired sessions) only starts when a sign-in code is sent; on a quiet day nothing is released or deleted. Fire-and-forget work can also be cut off on serverless. | Scheduled `/api/cron/housekeeping` (CRON_SECRET), plus `after()` from busy routes |
| 2 | P1 | No production start check: a missing `DATABASE_URL`, `VENDOR_DATA_KEY` or admin login is found only when a page fails | Startup validation (`instrumentation.ts`) and `/api/health` for the host |
| 3 | P1 | No error pages: an unexpected error shows Next's bare screen | `error.tsx` and `global-error.tsx` |
| 4 | P1 | Reports count counter-paid shop sales in "due to sellers" and commission (the seller already has the money), and put shop special prices under "coupon discounts" | Separate lines |
| 5 | P1 | Admin order page: a shop special price isn't shown, so the totals don't add up | Discount row |
| 6 | P2 | A seller can't cancel a shop-screen order when the customer walks away (only auto-cancel after 12 h) | "Cancel order" on the hand-over card |
| 7 | P2 | `readJson` reads the whole body before the size check; file uploads too | Content-Length pre-check |
| 8 | P2 | `/api/checkout` (Shopify, off) has no Origin check or rate limit; Shopify fetch has no timeout | Add both |
| 9 | P2 | Dealer API documents "60 requests per minute" but has no limit | Rate limit per dealer |
| 10 | P2 | Store checkout accepts the same product twice in one request | Reject duplicates |
| 11 | P2 | Wording: seller notice for a screen order paid online says "pack and ship"; a counter order's payment label says "WhatsApp" | Correct text |
| 12 | P3 | Admin audit and customer searches don't escape `%` / `_` | Shared `likeEscape` |
| 13 | P3 | Store order commission falls back to a literal 10 | `DEFAULT_COMMISSION_RATE` |
| 14 | P3 | `.env.example` misses DATABASE_POOL_MAX, OTP_EMAIL_PROVIDER, RESEND_FROM (and the new CRON_SECRET) | Document |
| 15 | P3 | Privacy policy doesn't cover accounts, rider location, the AI assistant or our email/SMS providers | Update the policy |
| 16 | P3 | No HSTS header | Add in production |
| 17 | P3 | No deployment runbook | `docs/DEPLOY.md` |

Checked and fine:
- Every query is parameterised; every dynamic SQL fragment comes from a fixed list.
- Every transaction uses its own connection.
- Every mutating browser route has the Origin check; the webhook and the dealer API are
  authenticated by signature / key.
- Production dependencies: 0 known vulnerabilities (the 5 in `npm audit` are in the ESLint dev tool).
- No secrets or dealer prices in built files.

Also found while fixing and fixed: sign-in codes counted a try and used a code in two steps, so
parallel guesses could get extra tries and one code could be used twice; both are now single
atomic statements.

## Verification after the fixes

- ESLint 0 problems; type check clean; production build (534 pages); no dealer prices or secrets in
  built files.
- Scripted suites:
  - 14 new checks:
    - health: minimal publicly, full report with the secret, no secret values
    - cron: 401 without or with a wrong secret, runs every step with it
    - an oversized body refused (413) before reading
    - Shopify checkout refuses cross-site requests; dealer API refuses a bad key
    - duplicate lines refused at the shop checkout
    - the seller cancels a counter order, which then can't be handed over
  - Re-run on the changed code: AI and shop 31, coupons 34, admin logins 54, payments 29,
    signatures 18, invoices 22.
  - Sign-in code checks: wrong, right, reuse refused, locked after 5.
- Browser:
  - theme switch;
  - a car picked in My Garage shows at once on the product page;
  - recently viewed;
  - all 462 pages load.
- Production start without DATABASE_URL / VENDOR_DATA_KEY stops with a clear `[config]` message.

Known, not code: the site's stock photography is loaded from images.unsplash.com through the image
optimiser (some loads timed out from this machine). For launch, prefer our own photos in `public/`
for the hero images.

Not changed on purpose: Next 16.4.2 / React 19.3 are out but only days old; stay on 16.4.0 / 19.2.8
for launch and upgrade after.
