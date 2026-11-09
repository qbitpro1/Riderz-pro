# Deploying riderzpro.com (runbook)

Written 18 Oct 2026. Owner of the steps: Hema (`docs/team/Hema_work.md`), with the inputs from the
other team files. Do it on **staging first**, then production.

## 1. What the app needs

- Node.js 20+, a host that runs Next.js 16 (Vercel recommended: `vercel.json` already schedules the
  hourly job).
- PostgreSQL 14+ (16 recommended), new and empty, with a pooled connection string (`Vamsi_work.md`).
  The connection is encrypted automatically for Neon and Supabase. For any other host (RDS, Render,
  DigitalOcean …) add `?sslmode=require` to the end of `DATABASE_URL`, or it connects without TLS.
  Tables are created and upgraded **automatically** on first start (`src/lib/db/migrations.ts`);
  nothing to run by hand.
- HTTPS on the domain (needed for "Detect my location" and rider tracking).

## 2. Settings (hosting dashboard → environment variables)

| Setting | Required | From |
| --- | --- | --- |
| `DATABASE_URL` | **yes**, the site refuses to start without it | Vamsi |
| `VENDOR_DATA_KEY` (`openssl rand -base64 32`; keep a copy in the password manager, never change it: there is no re-encryption, so a new key makes every seller's saved bank details and PAN unreadable) | **yes** | Vamsi |
| `ADMIN_USER` (an email) + `ADMIN_PASSWORD` (16+ characters) | for /admin | Hema |
| `CRON_SECRET` (long random text) | strongly | Hema |
| `NEXT_PUBLIC_SITE_URL` (`https://riderzpro.com`; staging its own address) | yes | Hema |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | **yes**: online payment is the only way to order | Sathwik |
| `RESEND_API_KEY`, `OTP_EMAIL_FROM`, `ORDERS_EMAIL_FROM` | for email codes and order emails | Amrutha |
| `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`, `MSG91_TEMPLATE_*` incl. `MSG91_TEMPLATE_STORE_RECEIPT` (or `TWILIO_*`) | for SMS | Amrutha |
| `ANTHROPIC_API_KEY` | optional: Salesman AI Full mode; Ask AI and Basic mode need no key | Owner (`Owner_work.md`) |
| `SALESMAN_FULL_AI_SHOPS` | optional: shop slugs that get Full mode (pilot: `indus-enterprises`); empty = all | Owner |
| `WEB_ASSISTANT_ENGINE` | optional: `claude` to answer Ask AI with Claude (needs the key) | Owner |
| `NEXT_PUBLIC_MAP_TILES_URL`, `ROUTING_BASE_URL` | optional (free defaults) | Viswanath |
| `SPEECH_TO_TEXT_PROVIDER`, `SARVAM_API_KEY` | optional: mic on shop screens whose browser has no speech recognition (see `.env.example`) | Owner |

`NEXT_PUBLIC_*` values are built into the site: after changing one, run `npm run build` again, a
restart alone isn't enough.

**Sign-in needs email or SMS.** Customers, riders and new sellers sign in with a one-time code. With
neither `RESEND_API_KEY` nor an SMS provider set, those sign-ins answer "not switched on yet" (the
start-up log warns). Set at least one before launch.

Never set on a server: `OTP_SEND_IN_DEV`, `RAZORPAY_API_BASE`, `ANTHROPIC_API_BASE` (local tests only).

Rate limits read the visitor's address from `x-vercel-forwarded-for` / `x-real-ip`, else the last
`x-forwarded-for` entry. On a host that is not Vercel, make sure its proxy sets `x-real-ip` (section 7).

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
   - On Vercel this is automatic (`vercel.json`), but an **hourly** cron needs the Pro plan; Hobby only
     allows daily jobs and refuses the deploy. On Hobby, change `vercel.json` to `0 3 * * *` and call
     the hourly job from an uptime service instead (the 30-minute release of unpaid online orders and
     the 20:30 IST shop summary depend on it).
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
- [ ] With Razorpay test keys: pay online with a test card / UPI; the order turns "Paid" and shows in
      `/admin/orders` and My orders, the confirmation email/SMS arrives, the invoice opens; refund ₹1
      from the admin order page.
- [ ] Seller: sign in, open the Offline Store, place a "pay at counter" order, mark it handed over.
- [ ] Rider: sign in on a phone, accept a test delivery, share location; the customer's order page
      shows the map.
- [ ] `/api/health` with the secret shows no unexpected warnings.

## 5. Going live and rolling back

- Switch the domain as in `Hema_work.md` §3. Keep the old site on a spare address for a week.
- To roll back: point the domain back to the old site. The new database stays as it is; switching
  forward again needs nothing more.
- Deploying a fix: merge the Pull Request into `old-deploy`, then follow section 6. Database changes
  ship as new migrations and apply themselves on the next start (they never edit an old one).
- Watch the host's logs for `[error]` lines (one per server error, without personal data) and for
  `[config]` warnings after each deploy.

## 6. Redeploying the live server (old-deploy)

riderzpro.com runs from the `old-deploy` branch on our Ubuntu server behind nginx. Fill in the real
folder and process name here the first time you run this: `/path/to/riderzpro` and `riderzpro` are
placeholders, and use whichever of pm2 or systemd the server already uses.

Settings live in a `.env` file in the app folder (`chmod 600`, never committed).

```bash
cd /path/to/riderzpro

# Note what is running, for a rollback
git rev-parse --short HEAD | tee ~/riderzpro-last-deploy

git fetch origin
git checkout old-deploy
git pull --ff-only origin old-deploy

# The build needs the dev packages, even if the shell has NODE_ENV=production
npm ci --include=dev
npm run build

pm2 restart riderzpro            # or: sudo systemctl restart riderzpro

pm2 logs riderzpro --lines 100 --nostream   # or: journalctl -u riderzpro -n 100 --no-pager

curl -s http://127.0.0.1:3000/api/health    # expect {"ok":true,"db":true}
```

Read the log after every deploy:

| Line | Meaning |
| --- | --- |
| `[config] features on: …` | The app started. Any other `[config]` line names a setting that is off or wrong. |
| `Riderzpro can't start: …` | A required setting is missing or wrong. Fix it and restart. |
| `[indus] Indus Enterprises set up: N products, M photos` | Printed **once**, on the start that creates the store. Later starts print nothing, which is fine: check that the Indus login still works. |
| `[indus] not set up: …` or `[indus] set-up failed: …` | The store was not created. Don't assume it exists. |
| `[error] …` | A server error. Look into it before calling the deploy done. |

To roll back, run the same steps with `git checkout <hash from ~/riderzpro-last-deploy>` instead of
the checkout and pull. Migrations only go forward and stay applied, so check a release's new
migrations before rolling back past it. Never reset the live database.

## 7. nginx

In the site's `server` block (`/etc/nginx/sites-available/riderzpro.com`, or see `sudo nginx -T`):

```nginx
# Seller uploads go up to 5 MB; nginx's default of 1 MB would refuse them.
client_max_body_size 10m;

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;

    # The app compares the browser's Origin with this; without it every sign-in and order gets a 403.
    proxy_set_header Host $host;

    # The visitor's address, for sign-in and order limits. Without it all visitors share one limit.
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

- **Keep port 3000 private.** Anyone reaching the app directly can fake `X-Real-IP`. Start it with
  `next start -H 127.0.0.1 -p 3000`, or close the port in the firewall.
- **If Cloudflare or another proxy is in front of nginx**, `$remote_addr` is that proxy, not the
  visitor. Set up nginx's `real_ip` module for it first.
- **To check it:** place an order from a phone on mobile data, then in the database run
  `SELECT key FROM rate_limits WHERE key LIKE 'order:%' ORDER BY window_start DESC LIMIT 5;`. It should
  show the phone's public address, not `127.0.0.1`.

## 8. Hourly cleanup job

We are not on Vercel, so `vercel.json` doesn't schedule this. The job releases unpaid and uncollected
orders, deletes old rider trails, clears expired sessions and sends the 20:30 IST shop summary.

Keep the secret in a private file, so it stays out of the crontab and the process list:

```bash
( umask 077; printf 'Authorization: Bearer %s\n' 'THE_CRON_SECRET' > ~/.riderzpro-cron-header )

# Try it. Expect JSON with "ok":true. 401 = wrong secret; 404 = CRON_SECRET isn't set on the app.
curl -sS -H @"$HOME/.riderzpro-cron-header" https://riderzpro.com/api/cron/housekeeping
```

Then add it with `crontab -e`:

```cron
0 * * * * curl -fsS --max-time 90 -H @"$HOME/.riderzpro-cron-header" https://riderzpro.com/api/cron/housekeeping >> "$HOME/riderzpro-cron.log" 2>&1
```

Check `~/riderzpro-cron.log` after the next hour.

## 9. Turning on online payment

Online payment is the only way to order, so **the Razorpay keys must be on the server before a
release with online-only checkout goes live**. Without them nobody can place an order.

1. Add the test keys and the webhook (section 3, step 6) to `.env`, then restart. A rebuild isn't
   needed for these. The log warns `Razorpay is in TEST mode`.
2. Test keys take no real money, but the checkout is open to the public. Keep the test short, then
   cancel the test orders.
3. At go-live, once KYC is approved, switch to the live keys and the live-mode webhook secret, then
   restart.

## 10. Uptime checks and logs

**Uptime.** Add two checks in any uptime service (UptimeRobot, Better Stack, Uptime Kuma …), every
5 minutes, alerting the owner and the developer by email and SMS/WhatsApp:

| Check | URL | Healthy |
| --- | --- | --- |
| Site and database | `https://riderzpro.com/api/health` | HTTP 200 and body contains `"ok":true` (503 = database down) |
| Home page | `https://riderzpro.com/` | HTTP 200 |

The hourly cleanup job (section 8) appends to `~/riderzpro-cron.log`; if the service supports
heartbeat ("cron") monitors, append `&& curl -fsS <heartbeat URL>` to the crontab line so a missed
hour raises an alert.

**Logs.** The app writes one `[error] …` line per server error (no personal data) and `[config] …`
lines at start-up.

- pm2: keep logs from filling the disk:
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 20M
  pm2 set pm2-logrotate:retain 14
  pm2 save
  ```
- systemd: journald rotates by itself; check `SystemMaxUse=` in `/etc/systemd/journald.conf`
  (e.g. `1G`).
- Daily look (or after each deploy):
  ```bash
  pm2 logs riderzpro --lines 2000 --nostream | grep -E '\[error\]|\[config\]|Razorpay'
  # or: journalctl -u riderzpro --since "24 hours ago" | grep -E '\[error\]|\[config\]|Razorpay'
  ```
- Payment problems also show in the Razorpay Dashboard → Webhooks → the webhook → recent deliveries.
  Failed deliveries there usually mean a wrong `RAZORPAY_WEBHOOK_SECRET` or the site being down.
