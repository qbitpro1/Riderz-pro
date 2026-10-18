# Hema: hosting, deployment and the domain switch

Updated 18 Oct 2026. The new site replaces the current riderzpro.com on the same domain (the old site
has no real customers). Follow `docs/DEPLOY.md` step by step; this is the list of what it needs from
you. Secrets go only into the hosting dashboard or a password manager.

## Before launch (must do)

1. **Hosting** for a Next.js 16 app on Node 20+ (Vercel recommended: `vercel.json` already schedules
   the hourly job). Give the developer access to the project, not billing.
2. **Staging site** (e.g. `staging.riderzpro.com`) with its own database (Vamsi) and test keys.
3. **Settings** (production and staging): enter what each person sends, plus your own:

   | Settings | From |
   | --- | --- |
   | `DATABASE_URL`, `DATABASE_POOL_MAX`, `VENDOR_DATA_KEY` | Vamsi |
   | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Sathwik |
   | `RESEND_API_KEY`, `OTP_EMAIL_FROM`, `ORDERS_EMAIL_FROM`, `MSG91_*` or `TWILIO_*`, `OTP_SMS_PROVIDER` | Amrutha |
   | `NEXT_PUBLIC_MAP_TILES_URL`, `ROUTING_BASE_URL` | Viswanath |
   | `ANTHROPIC_API_KEY` (AI assistants) | the owner (`Owner_work.md`) |
   | `ADMIN_USER` (owner's email), `ADMIN_PASSWORD` (16+ random characters, in the password manager) | you |
   | `CRON_SECRET` (long random text) | you |
   | `NEXT_PUBLIC_SITE_URL` (`https://riderzpro.com`; staging its own address) | you |

   Never set `OTP_SEND_IN_DEV`, `RAZORPAY_API_BASE` or `ANTHROPIC_API_BASE` on a server.
4. **Hourly job:** `GET /api/cron/housekeeping` with `Authorization: Bearer <CRON_SECRET>`
   (automatic on Vercel). It releases unpaid and uncollected orders and deletes old data on time.
5. **Uptime check** on `/api/health` (200 = OK, 503 = database down).
6. After each deploy, read the `[config]` lines in the log; a missing `DATABASE_URL` or
   `VENDOR_DATA_KEY` stops the start with a clear message.
7. The host must pass the visitor's real IP in `X-Forwarded-For` (Vercel does): sign-in limits and
   the audit log use it.
8. HTTPS on every address (the site sends HSTS for one year).

## Go-live day (domain switch)

1. Note every current DNS record; change only riderzpro.com and www; keep the email records (MX, SPF,
   DKIM, DMARC) as they are, and add Amrutha's Resend records.
2. Point riderzpro.com and www to the new hosting (HTTPS, www → riderzpro.com).
3. Keep the old site on a spare address (e.g. `old.riderzpro.com`) for a week for rollback, then
   switch it off. Old page addresses already redirect to the new pages.
4. Right after:
   - the owner signs in at `/admin/sign-in` and invites the team from `/admin/team`;
   - Sathwik saves the webhook;
   - Amrutha checks codes arrive;
   - run the smoke test in `docs/DEPLOY.md` §4.
