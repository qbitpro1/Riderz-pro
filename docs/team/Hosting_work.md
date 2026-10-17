# Hosting, domain and go-live (person: to be assigned by the owner)

Written 17 Oct 2026. Nothing here blocks building. It blocks **go-live** and the **real-phone tests** of
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
| `ADMIN_USER`, `ADMIN_PASSWORD` (login for `/admin`; a long random password) | This person |
| Map settings | Viswanath (`Viswanath_work.md`) |

Do **not** set `OTP_SEND_IN_DEV` on the hosting (development only).

## 3. Domain switch (go-live day only)

- [ ] Who controls riderzpro.com's DNS? Access for adding records.
- [ ] Point riderzpro.com and www to the new hosting; keep the old site on a spare subdomain for a
      week in case of rollback.
- [ ] The old site's addresses (`/login`, `/orders`, `/track/…`, `/vendor/…` and others) already
      redirect to the new pages.
- [ ] After the switch: open `/admin/vendors` and refresh the demo store; tell Sathwik to save the
      Razorpay webhook URL.

## When done

Tell the owner. The developer then deploys staging, runs the full test list there, and tests live
tracking on two real phones.
