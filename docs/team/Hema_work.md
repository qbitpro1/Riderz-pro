# Hema: hosting and go-live (this site replaces the current riderzpro.com)

Written 17 Oct 2026. This new site replaces the current riderzpro.com website **on the same domain**
(the old site has no real customers). Nothing here blocks building. It blocks **go-live** and the **real-phone tests** of
live tracking: browsers only share a phone's location on an `https://` address.

**How to send secrets:** never in chat, email, WhatsApp or git. Type them into the hosting dashboard's
environment settings.

## 1. Hosting

- [ ] Which hosting runs this Next.js 16 app (Vercel, or another Node host)? Name the account and give
      the developer access to the project, not to billing.
- [ ] A **staging** site (e.g. `staging.riderzpro.com`) on a separate database, for testing before go-live.
- [ ] Node.js 20 or newer.

## 2. Environment settings to enter (production and staging)

| Env name | Who provides it |
| --- | --- |
| `DATABASE_URL`, `DATABASE_POOL_MAX`, `VENDOR_DATA_KEY` | Vamsi (`Vamsi_work.md`) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Sathwik (`Sathwik_work.md`) |
| `RESEND_API_KEY`, `OTP_EMAIL_FROM`, `ORDERS_EMAIL_FROM`, `MSG91_*` (incl. `MSG91_TEMPLATE_*`) or `TWILIO_*`, `OTP_SMS_PROVIDER` | Amrutha (`Amrutha_work.md`) |
| `NEXT_PUBLIC_SITE_URL` (`https://riderzpro.com`; staging uses its own address) | Hema |
| `ADMIN_USER` (the owner's email), `ADMIN_PASSWORD` (a long random password): the owner's first login at `/admin/sign-in`, then kept as the way back in | Hema |
| `NEXT_PUBLIC_MAP_TILES_URL`, `ROUTING_BASE_URL` | Viswanath (`Viswanath_work.md`) |

Do **not** set `OTP_SEND_IN_DEV` or `RAZORPAY_API_BASE` on the hosting (development and tests only).

## 2b. Admin team logins (built 17 Oct 2026)

- [ ] After the first deploy, the owner signs in at `/admin/sign-in` with `ADMIN_USER` /
      `ADMIN_PASSWORD` and invites the team from `/admin/team` (each person gets a one-time link and
      their own password and role).
- [ ] The hosting must set the visitor's real IP in `X-Forwarded-For` (Vercel does). The sign-in
      rate limit and the audit log use it.
- [ ] Store the `ADMIN_PASSWORD` in the company password manager; change it if anyone who knew it leaves.

## 2c. Built 18 Oct 2026 for go-live (see docs/DEPLOY.md)

- [ ] Set `CRON_SECRET` (long random text). On Vercel `vercel.json` already calls
      `/api/cron/housekeeping` hourly; on another host set an hourly job sending
      `Authorization: Bearer <CRON_SECRET>`.
- [ ] Point the host's uptime check at `/api/health` (200 = database answering, 503 = not).
- [ ] After each deploy, read the `[config]` lines in the log. Two settings stop the start if
      missing: `DATABASE_URL`, `VENDOR_DATA_KEY`.
- [ ] HTTPS is required; the site sends HSTS (one year) in production.

## 3. Domain switch: replace the current site on riderzpro.com (go-live day only)

- [ ] Access to riderzpro.com's DNS (where it is managed, e.g. Cloudflare or the registrar).
- [ ] Before switching, write down every current DNS record. Change only the website records
      (riderzpro.com and www). Keep the **email records** (MX, SPF, DKIM, DMARC) exactly as they are.
- [ ] Add the Resend records for sending email from riderzpro.com (Amrutha will share them from
      Resend, see `Amrutha_work.md`).
- [ ] Point riderzpro.com and www to the new hosting, with HTTPS on both, and www redirecting to
      riderzpro.com.
- [ ] Keep the old site running on a spare address (e.g. `old.riderzpro.com`) for a week, so we can switch
      back if something goes wrong. Then shut it down.
- [ ] The old site's page addresses (`/login`, `/orders`, `/track/…`, `/vendor/…` and others) already
      redirect to the matching new pages, so old links and bookmarks keep working.
- [ ] After the switch: open `/admin/vendors` and refresh the demo store; tell Sathwik to save the
      Razorpay webhook URL; tell Amrutha to check that code emails and SMS arrive.

## When done

Tell the owner. The developer then deploys staging, runs the full test list there, and tests live
tracking on two real phones.
