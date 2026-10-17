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
| `RESEND_API_KEY`, `OTP_EMAIL_FROM`, `MSG91_*` or `TWILIO_*`, `OTP_SMS_PROVIDER` | Amrutha (`Amrutha_work.md`) |
| `ADMIN_USER`, `ADMIN_PASSWORD` (login for `/admin`; a long random password) | Hema |
| Map settings | Viswanath (`Viswanath_work.md`) |

Do **not** set `OTP_SEND_IN_DEV` on the hosting (development only).

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
