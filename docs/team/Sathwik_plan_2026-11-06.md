# Sathwik: plan for 6 Nov 2026

From the team task list of 5 Nov 2026. Covers the deploy and payments tasks marked **Now**. The code
and docs are on branch `sathwik/deploy-and-payments`. The steps below need the server or a Razorpay
login. Runbook: `docs/DEPLOY.md`, sections 6 to 9.

## Order for today

Do these in order. Steps 1 to 4 use today's `old-deploy` and don't depend on this branch.

| Step | Task | What to do | Done when |
| --- | --- | --- | --- |
| 1 | #3 Server settings | Check `.env` against `DEPLOY.md` section 2. **Keep the current `VENDOR_DATA_KEY`** (see "Decided"). | No unexpected `[config]` lines in the log |
| 2 | #1 Redeploy | Deploy the latest `old-deploy` using section 6. Fill in the real folder and process name. | Log shows `[indus] Indus Enterprises set up`; `/api/health` is OK |
| 3 | #5 nginx | Apply section 7. Check `client_max_body_size` too: the 1 MB default blocks seller uploads over 1 MB. | `rate_limits` shows a phone's real address |
| 4 | #4 Cleanup job | Apply section 8. | Manual call returns `"ok":true`; the log has a new line after the next hour |
| 5 | #7 Razorpay | Submit KYC. Add test keys and the webhook using section 9. | Log shows `Razorpay is in TEST mode` |
| 6 | #6 and #2 | Open a Pull Request from this branch into `old-deploy` and get it reviewed. **Merge only after step 5.** | Reviewed |
| 7 | #8 Payment test | After merging and redeploying: test card and UPI, order turns Paid, invoice opens, refund ₹1. Cancel the test orders. | All pass |

## Decided

1. **`VENDOR_DATA_KEY`: keep the current live key as the final one.** Save it in the password manager
   and tell Muni/Vamsi. The code can only use one key (`src/lib/server/security.ts`) and nothing
   re-encrypts saved data, so a new key would make sellers' bank details and PAN unreadable.
2. **Online-only checkout: merge once Razorpay test keys work on the server.** WhatsApp is how the live
   site takes orders today, and after this branch is deployed no order can be placed without keys.
   Don't announce the site until live keys are on.

## Status of every task

| # | Task | When | Status |
| --- | --- | --- | --- |
| 1 | Redeploy | Now | Server step |
| 2 | Deploy steps in `DEPLOY.md` | Now | **Written**; confirm the real folder and process name on the server |
| 3 | Server settings | Now | Server step; Amrutha's keys follow when ready |
| 4 | Hourly cleanup job | Now | **Steps written**; server step |
| 5 | nginx real IP | Now | **Config written**; server step |
| 6 | Remove WhatsApp ordering (server) | Now | **Code done on this branch**; merge after step 5 |
| 7 | Razorpay | Now | Test keys and a webhook secret are in the local `.env` (9 Nov). Still to do: the same three values in the server `.env`, the webhook in the Razorpay Dashboard (test mode), KYC, then live keys at go-live |
| 8 | Payment test | Next | After step 6. Mock-API run passes (`scripts/test-payments.mjs`) |
| 9 | GST check with the accountant | Next | Not started |
| 10 | No commission on shop-screen sales | Next | **Code done**: migration `019_store_sales_zero_commission` plus the Reports and seller copy. Review before deploy |
| 11 | Uptime and logs | Next | **Steps written** (`DEPLOY.md` section 10); set up the monitors on the server |
| 12 | CSP header and zod 4 | Later | On branch `sathwik/csp-zod4` (separate PR after this one) |

## What changed on this branch

- `POST /api/orders` only accepts `paymentMethod: "online"`. A request without it gets a 400. Before
  this fix, the old cart's WhatsApp button created an unpaid online order, told the customer it was
  placed, and the order was released 30 minutes later.
- The cart and checkout offer online payment only. This overlaps Sathese's task 2, as the task list
  expects ("with Sathwik").
- Old WhatsApp orders stay readable: the database values and labels are kept, and no migration is
  needed. `/admin/orders` had no WhatsApp filter to remove.
- Ask AI no longer tells customers to order on WhatsApp.
- `scripts/test-payments.mjs` now expects online-only behaviour.

## Commission (#10): done

Shop-screen sales carry no commission. What changed:

- New shop-screen sales save a 0% rate (`src/lib/server/store-sales.ts`).
- Migration `019_store_sales_zero_commission` sets the rate to 0 on older shop-screen orders
  (`orders.channel = 'store'`) that are **not yet in a payout** (`payout_id IS NULL`). Commission, its GST
  and the seller's net are worked out from the rate at payout time, so the rate is the only stored figure.
  Orders already paid out keep what was paid. Re-running it changes nothing. It changes live data on
  deploy, so have it reviewed. To see what it will touch beforehand:
  `SELECT count(*), sum(vo.subtotal) FROM vendor_orders vo JOIN orders o ON o.id = vo.order_id WHERE o.channel = 'store' AND vo.commission_rate <> 0 AND vo.payout_id IS NULL;`
- Admin Reports: the "Commission on counter sales … billing rule to be decided" card is gone; counter
  sales now say "No commission on counter sales (0%)". WhatsApp counts show as "WhatsApp (older orders)".
- Seller Payments page: says commission applies to online orders only and shop sales have none.

## For teammates

- **Sathese:** start your WhatsApp work after this merges, because `CheckoutForm.tsx` and `CartView.tsx`
  changed and `cartMessage.ts` is gone.
- **Hima Bindu:** done here. Reports labels WhatsApp as "older orders", and `PaymentCard.tsx` now
  tells counter, older WhatsApp and cash-on-delivery orders apart.
- **Policies and FAQ:** done here. `policies.ts` and `faq.ts` describe paying online with Razorpay,
  SMS/email confirmation and tracking on My orders. WhatsApp stays as the support contact.
- **Whoever owns the task list:** it points to `docs/GO_LIVE.md`, which isn't on `main` or `old-deploy`.
