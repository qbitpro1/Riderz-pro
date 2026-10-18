# Deploying riderzpro.com (runbook)

Written 18 Oct 2026. Owner of the steps: Hema (`docs/team/Hema_work.md`), with the inputs from the
other team files. Do it on **staging first**, then production.

## 1. What the app needs

- Node.js 20+, a host that runs Next.js 16 (Vercel recommended: `vercel.json` already schedules the
  hourly job).
- PostgreSQL 14+ (16 recommended), new and empty, with a pooled connection string (`Vamsi_work.md`).
  Tables are created and upgraded **automatically** on first start (`src/lib/db/migrations.ts`);
  nothing to run by hand.
- HTTPS on the domain (needed for "Detect my location" and rider tracking).

## 2. Settings (hosting dashboard → environment variables)

| Setting | Required | From |
| --- | --- | --- |
| `DATABASE_URL` | **yes**, the site refuses to start without it | Vamsi |
| `VENDOR_DATA_KEY` (`openssl rand -base64 32`; keep a copy in the password manager, never change it) | **yes** | Vamsi |
| `ADMIN_USER` (an email) + `ADMIN_PASSWORD` (16+ characters) | for /admin | Hema |
| `CRON_SECRET` (long random text) | strongly | Hema |
| `NEXT_PUBLIC_SITE_URL` (`https://riderzpro.com`; staging its own address) | yes | Hema |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | for online payment | Sathwik |
| `RESEND_API_KEY`, `OTP_EMAIL_FROM`, `ORDERS_EMAIL_FROM` | for email codes and order emails | Amrutha |
| `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`, `MSG91_TEMPLATE_*` (or `TWILIO_*`) | for SMS | Amrutha |
| `ANTHROPIC_API_KEY` | for the AI assistants | `AI_work.md` |
| `NEXT_PUBLIC_MAP_TILES_URL`, `ROUTING_BASE_URL` | optional (free defaults) | Viswanath |

Never set on a server: `OTP_SEND_IN_DEV`, `RAZORPAY_API_BASE`, `ANTHROPIC_API_BASE` (local tests only).

## 3. First deploy

1. Create the project from the `main` branch; set the settings above; deploy.
2. The start-up log shows `[config] features on: …` and a line for anything that is off. A missing
   `DATABASE_URL` or bad `VENDOR_DATA_KEY` stops the start with `Riderzpro can't start: …`.
3. Check health:
   ```bash
   curl -s https://STAGING_URL/api/health
   ```
   You should get `{"ok":true,"db":true}`. For the full report (latest migration, features, warnings):
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" https://STAGING_URL/api/health
   ```
4. **Scheduled job.** Call `GET /api/cron/housekeeping` hourly with
   `Authorization: Bearer <CRON_SECRET>`.
   - On Vercel this is automatic (`vercel.json`).
   - Elsewhere, use the host's cron or any uptime service that can send a header.
   - It releases unpaid and uncollected orders, deletes rider trails on time, and clears expired
     sessions.
5. **Admin.** Sign in at `/admin/sign-in` with `ADMIN_USER` / `ADMIN_PASSWORD`. Invite the team from
   `/admin/team`.
6. **Razorpay webhook** (Sathwik):
   - URL: `https://riderzpro.com/api/payments/razorpay/webhook`.
   - Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.created`,
     `refund.processed`, `refund.failed`.
   - Secret: `RAZORPAY_WEBHOOK_SECRET`.
7. **Demo store** (optional): `/admin/vendors` → refresh the demo store.

## 4. Smoke test (staging, then production right after the switch)

- [ ] Home, shop, a product page, `/offers`, `/assistant` load.
- [ ] Sign in with a mobile/email code (a real code arrives); the account page opens.
- [ ] Place a WhatsApp order; it shows in `/admin/orders` and in My orders.
- [ ] With Razorpay test keys: pay online with a test card / UPI; the order turns "Paid", the
      confirmation email/SMS arrives, the invoice opens; refund ₹1 from the admin order page.
- [ ] Seller: sign in, open the Offline Store, place a "pay at counter" order, mark it handed over.
- [ ] Rider: sign in on a phone, accept a test delivery, share location; the customer's order page
      shows the map.
- [ ] `/api/health` with the secret shows no unexpected warnings.

## 5. Going live and rolling back

- Switch the domain as in `Hema_work.md` §3. Keep the old site on a spare address for a week.
- To roll back: point the domain back to the old site. The new database stays as it is; switching
  forward again needs nothing more.
- Deploying a fix: push to `main`. Database changes ship as new migrations and apply themselves on
  the next start (they never edit an old one).
- Watch the host's logs for `[error]` lines (one per server error, without personal data) and for
  `[config]` warnings after each deploy.
