# Status and what's next (updated 18 Oct 2026)

## State

- Repo `qbitpro1/Riderz-pro`. `main` = the finished V0.4 (merged 18 Oct 2026), ready to deploy once
  the team's inputs are in. New work goes on a new branch (e.g. `V0.5`) and is merged when finished.
- This repo replaces the old riderzpro.com (old repo `Viswanath5177/Riderzpro`, which had no real
  customers). Car accessories only.
- **Migrated from the old site:** everything in scope.
  - Customer accounts and OTP.
  - Riders, dispatch and live tracking.
  - Razorpay payments and refunds; GST invoices; order emails and SMS.
  - Coupons and offers; the help desk.
  - Admin team, roles, audit, customers and reports.
  - The AI assistant, plus the Offline Store AI salesperson with on-screen checkout.
- **Skipped on purpose:** the EV/bike range and VIN lookup, the Python server, "quantum" dispatch.
- Last full audit: `docs/AUDIT_V0.5.md` (all fixed). Deploy runbook: `docs/DEPLOY.md`.

## Waiting on the team (details in `docs/team/`)

- **Sathwik:** Razorpay keys, webhook, KYC, GST details, accountant check, refund and commission rules.
- **Vamsi:** staging and production PostgreSQL, backups, `VENDOR_DATA_KEY`.
- **Amrutha:** rotate the leaked Resend and Twilio keys; SMS provider and DLT templates; Resend domain;
  test recipients.
- **Viswanath:** OpenStreetMap contact email, tile provider, routing choice.
- **Hema:** hosting, staging, settings, cron and uptime checks, the domain switch.
- **Owner:** Anthropic account and key; own hero photos; the bargaining cap.

## Next for the developer

1. When inputs arrive: staging deploy, then the smoke test in `docs/DEPLOY.md` §4 with the real test
   keys (payments, refund, real email and SMS, tracking on two phones, the invoice-numbering test on
   real Postgres).
2. Go-live with Hema (domain switch), then a smoke test on production.
3. Not built, waiting for the owner:
   - the header "Deliver to" picker;
   - reviews and warranty;
   - installation bookings;
   - the mobile app (rider first).
4. After launch: upgrade Next 16.4.x / React 19.3 when those patches are two weeks old.

## Working rules

- Every change:
  - lint 0, type check, production build (534 pages), dealer-price and secret scan of `.next`;
  - scripted tests;
  - a browser check;
  - an update to `docs/WORK_UPDATE.md`.
- Before scripted tests:
  - move `.env.local` aside (it has `OTP_SEND_IN_DEV=true` and a real Resend key) and back up
    `.data/pglite`; restore both after;
  - stop the dev server before `next build`, and delete `.next/dev` after a build.
- Local test logins: seller `indus@riderzpro.com` / `12345`; customer 9123456780; riders 9811111111
  (Saroj) and 9822222222.
